<template>
	<view class="page">
		<uni-segmented-control :current="tabIndex" :values="tabs" @clickItem="switchTab" style-type="text" active-color="#6366f1" />
		<!-- 申请报修 -->
		<view v-show="tabIndex === 0" class="tab-pane">
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
				<view v-if="isEdit" class="btn-cancel-edit" @click="cancelEdit">取消编辑</view>
			</view>
		</view>
		<!-- 报修记录 -->
		<view v-show="tabIndex === 1" class="tab-pane">
			<unicloud-db ref="udb" collection="medical-device-repair-request" :where="where" page-data="replace"
				:orderby="'request_date desc'" :getcount="true" :page-size="15"
				v-slot:default="{data, pagination, hasMore, loading, error}" @load="onqueryload">
				<view class="list-wrap">
					<view class="card-row" v-for="(item, i) in tableData" :key="i">
						<view class="card-content" @click="toDetail(item)">
							<view class="item-top">
								<text class="item-device">{{ item.device_name || '未知设备' }}</text>
								<uni-tag :text="item.status_text || '未知'" :type="item.status_type || 'default'" size="small" />
							</view>
							<text class="item-desc">{{ item.fault_description }}</text>
							<view class="item-meta">
								<text class="item-date">{{ item.date_text || '' }}</text>
								<text class="item-urgency" v-if="item.urgency_text">紧急: {{ item.urgency_text }}</text>
							</view>
						</view>
						<view class="card-actions">
							<view v-if="!hasRepairMap[item._id]" class="action-btn action-edit" @click.stop="toEdit(item)">
								<uni-icons type="compose" size="20" color="#6366f1"></uni-icons>
								<text>编辑</text>
							</view>
							<view class="action-btn action-delete" @click.stop="deleteRepairRequest(item)">
								<uni-icons type="trash" size="20" color="#ef4444"></uni-icons>
								<text>删除</text>
							</view>
						</view>
					</view>
				</view>
				<uni-load-state :state="{data: tableData, pagination, hasMore, loading, error}" @loadMore="loadMore" />
			</unicloud-db>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const dbCmd = db.command;
import { store } from '@/uni_modules/uni-id-pages/common/store.js';

const statusMap = {
	1: { text: '待处理', type: 'warning' },
	2: { text: '处理中', type: 'primary' },
	3: { text: '已完成', type: 'success' },
	4: { text: '已关闭', type: 'info' }
};
const urgencyMap = {
	1: { text: '一般', type: 'info' },
	2: { text: '紧急', type: 'warning' },
	3: { text: '非常紧急', type: 'error' }
};

export default {
	data() {
		const uid = store.userInfo?._id || '';
		const userInfo = store.userInfo || {};
		return {
			tabs: ['申请报修', '我的报修'],
			tabIndex: 0,
			formData: {
				device_id: '',
				request_date: Date.now(),
				requester: userInfo.nickname || userInfo.username || '',
				phone: userInfo.mobile || '',
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
			originalStatus: null,
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
			},
			where: { deleted: 0, creator: uid },
			tableData: [],
			hasRepairMap: {},
			trackingRequestIds: [],
			defaultDeviceId: '',
			defaultDeviceName: ''
		};
	},
	computed: {
		uid() {
			return store.userInfo?._id || '';
		}
	},
	onLoad(e) {
		if (e.device_id) {
			this.defaultDeviceId = e.device_id;
			this.defaultDeviceName = decodeURIComponent(e.device_name || '');
		}
		if (e.tab != null) this.tabIndex = Number(e.tab) || 0;
		this.loadDevices();
		this.loadTrackingRequestIds();
		uni.$on('repair-refresh', () => {
			if (this.tabIndex === 1) this.loadData(true);
		});
	},
	onUnload() {
		uni.$off('repair-refresh');
	},
	methods: {
		switchTab(e) {
			this.tabIndex = e.currentIndex;
			if (this.tabIndex === 0) {
				if (!this.deviceCandidates.length) this.loadDevices();
			} else {
				this.where = { deleted: 0, creator: this.uid };
			}
		},
		async loadDevices() {
			try {
				const res = await db.collection('medical-device').where({ deleted: 0, status: 2 }).field('_id,name,code').limit(10000).get();
				const dataList = [...(res.result.data || [])];
				const map = {};
				const candidates = dataList.map(d => {
					const text = d.name + ' (' + d.code + ')';
					map[text] = d._id;
					return text;
				});
				this.deviceOptionMap = map;
				this.deviceCandidates = candidates;
				if (this.defaultDeviceId) this.setDeviceById(this.defaultDeviceId, this.defaultDeviceName);
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
		onDeviceInput(val) {
			this.formData.device_id = this.deviceOptionMap[val] || '';
		},
		async loadTrackingRequestIds() {
			try {
				const uid = this.uid;
				if (!uid) return;
				const res = await db.collection('medical-device-repair-request')
					.where({ deleted: 0, creator: uid })
					.field('_id').limit(1000).get();
				this.trackingRequestIds = (res.result.data || []).map(i => i._id);
			} catch (e) { console.error(e); }
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
				if (this.isEdit) this.cancelEdit();
				else this.resetForm();
				this.tabIndex = 1;
				this.where = { deleted: 0, creator: this.uid };
			} catch (e) {
				console.error(e);
				uni.showToast({ title: e.message || '操作失败', icon: 'none' });
			} finally {
				this.submitting = false;
			}
		},
		resetForm() {
			const userInfo = store.userInfo || {};
			this.formData = {
				device_id: '',
				request_date: Date.now(),
				requester: userInfo.nickname || userInfo.username || '',
				phone: userInfo.mobile || '',
				fault_description: '',
				urgency: 1,
				status: 1,
				handler: '',
				handle_date: null,
				handle_result: '',
				remark: ''
			};
			this.formId = '';
			this.isEdit = false;
			this.deviceText = '';
		},
		async toEdit(item) {
			this.tabIndex = 0;
			this.isEdit = true;
			this.formId = item._id;
			try {
				const res = await db.collection('medical-device-repair-request').doc(item._id).get();
				const data = res.result.data[0];
				if (data) {
					this.originalStatus = data.status;
					this.formData = {
						device_id: data.device_id || '',
						request_date: data.request_date || Date.now(),
						requester: data.requester || '',
						phone: data.phone || '',
						fault_description: data.fault_description || '',
						urgency: data.urgency != null ? data.urgency : 1,
						status: data.status != null ? data.status : 1,
						handler: data.handler || '',
						handle_date: data.handle_date || null,
						handle_result: data.handle_result || '',
						remark: data.remark || ''
					};
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
		cancelEdit() {
			this.resetForm();
		},
		toDetail(item) {
			uni.navigateTo({ url: '/pages/repair-request/detail?id=' + item._id });
		},
		toRecordRepair(item) {
			uni.navigateTo({
				url: '/pages/repair-request/repair-add?mode=add&request_id=' + item._id
					+ '&device_id=' + item.device_id
					+ '&device_name=' + encodeURIComponent(item.device_name || '')
					+ '&fault_description=' + encodeURIComponent(item.fault_description || '')
			});
		},
		async deleteRepairRequest(item) {
			try {
				const checkRes = await db.collection('medical-device-repair').where({
					repair_request_id: item._id,
					deleted: 0
				}).field('_id').get();
				if (checkRes.result.data.length) {
					uni.showModal({
						title: '无法删除',
						content: '该报修单存在关联维修记录，请先删除维修记录。',
						showCancel: false
					});
					return;
				}
			} catch (e) { return; }
			uni.showModal({
				title: '确认删除',
				content: '确定删除该报修单吗？',
				success: async (res) => {
					if (!res.confirm) return;
					try {
						await db.collection('medical-device-repair-request').doc(item._id).update({
							deleted: 1,
							updated_at: Date.now()
						});
						if (item.device_id) {
							await db.collection('medical-device').doc(item.device_id).update({
								status: 2,
								updated_at: Date.now()
							});
						}
						uni.showToast({ title: '删除成功', icon: 'success' });
						this.loadData(true);
					} catch (e) {
						uni.showToast({ title: e.message || '操作失败', icon: 'none' });
					}
				}
			});
		},
		loadData(clear = true) {
			this.$refs.udb && this.$refs.udb.loadData({ clear });
		},
		loadMore() { this.$refs.udb?.loadMore(); },
		async onqueryload(data) {
			const deviceIds = [...new Set(data.map(i => i.device_id).filter(Boolean))];
			const deviceMap = {};
			if (deviceIds.length) {
				const deviceRes = await db.collection('medical-device').where({ _id: dbCmd.in(deviceIds) }).field('_id,name').get();
				(deviceRes.result.data || []).forEach(d => { deviceMap[d._id] = d.name; });
			}
			const requestIds = data.map(i => i._id).filter(Boolean);
			const hasRepairMap = {};
			if (requestIds.length) {
				const repairRes = await db.collection('medical-device-repair').where({ deleted: 0, repair_request_id: dbCmd.in(requestIds) }).field('repair_request_id').limit(1000).get();
				(repairRes.result.data || []).forEach(r => { hasRepairMap[r.repair_request_id] = true; });
			}
			this.hasRepairMap = hasRepairMap;
			this.tableData = data.map(item => {
				const s = statusMap[item.status];
				const u = urgencyMap[item.urgency];
				return {
					...item,
					device_name: deviceMap[item.device_id] || '未知',
					status_text: s?.text || '未知',
					status_type: s?.type || 'default',
					urgency_text: u?.text || '',
					date_text: item.request_date ? new Date(item.request_date).toLocaleDateString('zh-CN') : ''
				};
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; }
.uni-segmented-control { background: #fff; padding: 12rpx 0; }
.tab-pane { padding: 20rpx; }
.uni-forms { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.submit-bar { padding: 40rpx 0; text-align: center; }
.btn-submit { background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 24rpx; font-size: 30rpx; }
.btn-cancel-edit { color: #999; font-size: 24rpx; padding: 20rpx 0; cursor: pointer; }
.list-wrap { padding: 0; }
.card-row { background: #fff; border-radius: 16rpx; margin-bottom: 20rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.card-content { padding: 24rpx 30rpx 16rpx; cursor: pointer; }
.item-top { display: flex; justify-content: space-between; align-items: center; }
.item-device { font-size: 28rpx; font-weight: 600; color: #1e293b; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-desc { font-size: 24rpx; color: #666; display: block; margin-top: 10rpx; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.item-meta { display: flex; gap: 20rpx; margin-top: 12rpx; }
.item-date, .item-urgency { font-size: 22rpx; color: #94a3b8; }
.card-actions { display: flex; border-top: 1rpx solid #f5f5f7; }
.action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx; padding: 18rpx 0; font-size: 24rpx; cursor: pointer; &:active { opacity: 0.7; } }
.action-edit { color: #6366f1; }
.action-delete { color: #ef4444; }
</style>
