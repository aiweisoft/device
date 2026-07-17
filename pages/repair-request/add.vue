<template>
	<view class="page">
		<uni-forms ref="form" :modelValue="formData" :rules="rules">
			<uni-forms-item label="关联设备" name="device_id">
				<uni-combox v-model="deviceText" :candidates="deviceCandidates" placeholder="搜索或选择设备" @input="onDeviceInput" />
			</uni-forms-item>
			<uni-forms-item label="报修日期" name="request_date">
				<uni-datetime-picker v-model="formData.request_date" return-type="timestamp" placeholder="请选择报修日期" />
			</uni-forms-item>
			<uni-forms-item label="报修人" name="requester">
				<uni-easyinput v-model="formData.requester" placeholder="请输入报修人" />
			</uni-forms-item>
			<uni-forms-item label="联系电话" name="phone">
				<uni-easyinput v-model="formData.phone" placeholder="请输入联系电话" />
			</uni-forms-item>
			<uni-forms-item label="故障描述" name="fault_description">
				<uni-easyinput type="textarea" v-model="formData.fault_description" placeholder="请描述设备故障现象" />
			</uni-forms-item>
			<uni-forms-item label="紧急程度" name="urgency">
				<uni-data-select v-model="formData.urgency" :localdata="urgencyOptions" placeholder="请选择紧急程度" />
			</uni-forms-item>
			<uni-forms-item label="备注">
				<uni-easyinput type="textarea" v-model="formData.remark" placeholder="其他说明（选填）" />
			</uni-forms-item>
		</uni-forms>
		<view class="submit-bar">
			<button class="btn-submit" @click="submit" :loading="submitting">{{ isEdit ? '更新' : '提交报修' }}</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
import { store } from '@/uni_modules/uni-id-pages/common/store.js';

export default {
	data() {
		return {
			formData: {
				device_id: '',
				request_date: Date.now(),
				requester: (store.userInfo?.nickname || store.userInfo?.username || ''),
				phone: store.userInfo?.mobile || '',
				fault_description: '',
				urgency: 1,
				status: 1,
				handler: '',
				handle_date: null,
				handle_result: '',
				remark: ''
			},
			formId: '',
			isEdit: false,
			deviceCandidates: [],
			deviceOptionMap: {},
			deviceText: '',
			urgencyOptions: [
				{ value: 1, text: '一般' },
				{ value: 2, text: '紧急' },
				{ value: 3, text: '非常紧急' }
			],
			statusOptions: [
				{ value: 1, text: '待处理' },
				{ value: 2, text: '处理中' },
				{ value: 3, text: '已完成' },
				{ value: 4, text: '已关闭' }
			],
			submitting: false,
			rules: {
				device_id: { rules: [{ required: true, errorMessage: '请选择设备' }] },
				fault_description: { rules: [{ required: true, errorMessage: '请描述故障现象' }] },
				phone: { rules: [{ pattern: /^1\d{10}$/, errorMessage: '请输入正确的手机号' }] }
			}
		};
	},
	onLoad(e) {
		this.isEdit = e.mode === 'edit';
		this.formId = e.id || '';
		if (this.isEdit) {
			uni.setNavigationBarTitle({ title: '编辑报修' });
			this.loadDevices().then(() => this.loadDetail());
		} else {
			this.loadDevices();
			if (e.device_id) {
				this.setDeviceById(e.device_id, e.device_name);
			}
		}
	},
	methods: {
		async loadDevices() {
			try {
				const condition = { deleted: 0, status: 2 };
				const res = await db.collection('medical-device').where(condition).field('_id,name,code').limit(10000).get();
				const dataList = [...(res.result.data || [])];
				const map = {};
				const candidates = dataList.map(d => {
					const text = d.name + ' (' + d.code + ')';
					map[text] = d._id;
					return text;
				});
				this.deviceOptionMap = map;
				this.deviceCandidates = candidates;
			} catch (e) { console.error(e); }
		},
		async setDeviceById(id, name) {
			try {
				if (name) {
					const res = await db.collection('medical-device').doc(id).field('code').get();
					const code = res.result.data[0]?.code || '';
					const text = name + ' (' + code + ')';
					this.deviceText = text;
					this.formData.device_id = id;
					return;
				}
				const res = await db.collection('medical-device').doc(id).field('_id,name,code').get();
				const device = res.result.data && res.result.data[0];
				if (device) {
					const text = device.name + ' (' + device.code + ')';
					this.deviceText = text;
					this.formData.device_id = device._id;
				}
			} catch (e) { console.error(e); }
		},
		async loadDetail() {
			try {
				const res = await db.collection('medical-device-repair-request').doc(this.formId).get();
				const data = res.result.data[0];
				if (data) {
					this.originalStatus = data.status;
					this.formData = Object.assign({}, this.formData, {
						device_id: data.device_id || '',
						request_date: data.request_date || this.formData.request_date,
						requester: data.requester || '',
						phone: data.phone || '',
						fault_description: data.fault_description || '',
						urgency: data.urgency != null ? data.urgency : 1,
						status: data.status != null ? data.status : 1,
						handler: data.handler || '',
						handle_date: data.handle_date || null,
						handle_result: data.handle_result || '',
						remark: data.remark || ''
					});
					const matched = Object.keys(this.deviceOptionMap).find(k => this.deviceOptionMap[k] === data.device_id);
					if (matched) {
						this.deviceText = matched;
					} else if (data.device_id) {
						const deviceRes = await db.collection('medical-device').doc(data.device_id).field('name,code').get();
						const device = deviceRes.result.data[0];
						if (device) {
							const text = device.name + ' (' + device.code + ')';
							this.deviceOptionMap[text] = device._id;
							this.deviceCandidates.push(text);
							this.$nextTick(() => { this.deviceText = text; });
						}
					}
				}
			} catch (e) { console.error(e); }
		},
		onDeviceInput(val) {
			this.formData.device_id = this.deviceOptionMap[val] || '';
		},
		async submit() {
			try {
				await this.$refs.form.validate();
			} catch (e) { return; }
			this.submitting = true;
			try {
				if (this.isEdit) {
					await db.collection('medical-device-repair-request').doc(this.formId).update({
						device_id: this.formData.device_id,
						request_date: this.formData.request_date,
						requester: this.formData.requester,
						phone: this.formData.phone,
						fault_description: this.formData.fault_description,
						urgency: this.formData.urgency,
						remark: this.formData.remark,
						updated_at: Date.now()
					});
				} else {
					const deviceRes = await db.collection('medical-device').doc(this.formData.device_id).field('status').get();
					const oldStatus = deviceRes.result.data[0]?.status || 2;
					if (oldStatus === 3) {
						this.submitting = false;
						uni.showToast({ title: '该设备已在维修中，无需重复报修', icon: 'none' });
						return;
					}
					await db.collection('medical-device-repair-request').add({
						...this.formData,
						status: 1,
						deleted: 0,
						creator: store.userInfo?._id || ''
					});
					await db.collection('medical-device').doc(this.formData.device_id).update({
						status: 3,
						updated_at: Date.now()
					});
				}
				uni.showToast({ title: this.isEdit ? '修改成功' : '报修提交成功', icon: 'success' });
				uni.$emit('repair-refresh');
				setTimeout(() => uni.navigateBack(), 500);
			} catch (e) {
				console.error(e);
				uni.showToast({ title: e.message || '操作失败', icon: 'none' });
			} finally {
				this.submitting = false;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; padding: 20rpx; }
.uni-forms { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.submit-bar { padding: 40rpx 0; }
.btn-submit { background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 24rpx; font-size: 30rpx; }
</style>
