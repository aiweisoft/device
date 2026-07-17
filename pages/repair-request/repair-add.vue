<template>
	<view class="page">
		<view class="info-card">
			<view class="info-title">关联信息</view>
			<view class="info-row"><text class="label">设备名称</text><text class="value">{{ deviceName || '-' }}</text></view>
			<view class="info-row-column"><text class="label">故障描述</text><text class="value">{{ faultDescription || formData.fault_description || '-' }}</text></view>
		</view>
		<uni-forms ref="form" :modelValue="formData" :rules="rules">
			<uni-forms-item label="维修结果" name="result">
				<uni-data-select v-model="formData.result" :localdata="resultOptions" placeholder="请选择维修结果" />
			</uni-forms-item>
			<uni-forms-item label="维修日期" name="repair_date">
				<uni-datetime-picker v-model="formData.repair_date" return-type="timestamp" placeholder="请选择维修日期" />
			</uni-forms-item>
			<uni-forms-item label="故障描述" name="fault_description">
				<uni-easyinput type="textarea" v-model="formData.fault_description" placeholder="请输入故障描述" />
			</uni-forms-item>
			<uni-forms-item label="故障原因" name="fault_reason">
				<uni-easyinput v-model="formData.fault_reason" placeholder="请输入故障原因" />
			</uni-forms-item>
			<uni-forms-item label="维修方式" name="repair_method">
				<uni-easyinput v-model="formData.repair_method" placeholder="请输入维修方式" />
			</uni-forms-item>
			<uni-forms-item label="维修人员" name="repair_person">
				<uni-easyinput v-model="formData.repair_person" placeholder="请输入维修人员" />
			</uni-forms-item>
			<uni-forms-item label="维修公司" name="repair_company">
				<uni-easyinput v-model="formData.repair_company" placeholder="请输入维修公司" />
			</uni-forms-item>
			<uni-forms-item label="维修费用" name="cost">
				<uni-easyinput v-model="formData.cost" placeholder="请输入维修费用" type="digit" />
			</uni-forms-item>
			<uni-forms-item label="备注">
				<uni-easyinput type="textarea" v-model="formData.remark" placeholder="其他说明（选填）" />
			</uni-forms-item>
		</uni-forms>
		<view class="submit-bar">
			<button class="btn-submit" @click="submit" :loading="submitting">{{ isEdit ? '更新' : '提交维修记录' }}</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();

export default {
	data() {
		return {
			formData: {
				device_id: '',
				repair_request_id: '',
				repair_date: Date.now(),
				fault_description: '',
				fault_reason: '',
				repair_method: '',
				repair_person: '',
				repair_company: '',
				cost: '',
				result: 1,
				remark: ''
			},
			formId: '',
			isEdit: false,
			deviceName: '',
			faultDescription: '',
			submitting: false,
			resultOptions: [
				{ value: 1, text: '已修复' },
				{ value: 2, text: '部分修复' },
				{ value: 3, text: '无法修复' }
			],
			rules: {
				result: { rules: [{ required: true, errorMessage: '请选择维修结果' }] },
				repair_date: { rules: [{ required: true, errorMessage: '请选择维修日期' }] },
				fault_description: { rules: [{ required: true, errorMessage: '请输入故障描述' }] }
			}
		};
	},
	onLoad(e) {
		this.isEdit = e.mode === 'edit';
		if (this.isEdit) {
			uni.setNavigationBarTitle({ title: '编辑维修记录' });
			this.formId = e.id || '';
			this.loadDetail();
		} else {
			this.formData.repair_request_id = e.request_id || '';
			this.formData.device_id = e.device_id || '';
			this.deviceName = e.device_name ? decodeURIComponent(e.device_name) : '';
			this.faultDescription = e.fault_description ? decodeURIComponent(e.fault_description) : '';
			if (!this.formData.fault_description && this.faultDescription) {
				this.formData.fault_description = this.faultDescription;
			}
		}
	},
	methods: {
		async loadDetail() {
			try {
				const res = await db.collection('medical-device-repair').doc(this.formId).get();
				const data = res.result.data[0];
				if (!data) {
					uni.showToast({ title: '维修记录不存在', icon: 'none' });
					setTimeout(() => uni.navigateBack(), 1500);
					return;
				}
				this.formData = Object.assign({}, this.formData, {
					device_id: data.device_id || '',
					repair_request_id: data.repair_request_id || '',
					repair_date: data.repair_date || this.formData.repair_date,
					fault_description: data.fault_description || '',
					fault_reason: data.fault_reason || '',
					repair_method: data.repair_method || '',
					repair_person: data.repair_person || '',
					repair_company: data.repair_company || '',
					cost: data.cost != null ? String(data.cost) : '',
					result: data.result != null ? data.result : 1,
					remark: data.remark || ''
				});
				if (data.device_id) {
					db.collection('medical-device').doc(data.device_id).field('name,code').get().then(r => {
						const d = r.result.data[0];
						this.deviceName = d ? d.name + ' (' + d.code + ')' : '';
					});
				}
				if (data.repair_request_id) {
					db.collection('medical-device-repair-request').doc(data.repair_request_id).field('fault_description').get().then(r => {
						this.faultDescription = r.result.data[0]?.fault_description || '';
					});
				}
			} catch (e) { console.error(e); }
		},
		async submit() {
			try {
				await this.$refs.form.validate();
			} catch (e) { return; }
			this.submitting = true;
			try {
				const cost = this.formData.cost ? parseFloat(this.formData.cost) : 0;
				const repairData = {
					device_id: this.formData.device_id,
					repair_request_id: this.formData.repair_request_id,
					repair_date: this.formData.repair_date,
					fault_description: this.formData.fault_description,
					fault_reason: this.formData.fault_reason,
					repair_method: this.formData.repair_method,
					repair_person: this.formData.repair_person,
					repair_company: this.formData.repair_company,
					cost: cost,
					result: this.formData.result,
					remark: this.formData.remark
				};
				if (this.isEdit) {
					await db.collection('medical-device-repair').doc(this.formId).update({
						...repairData,
						updated_at: Date.now()
					});
				} else {
					await db.collection('medical-device-repair').add({
						...repairData,
						deleted: 0
					});
				}
				const promises = [];
				if (this.formData.result === 1) {
					promises.push(
						db.collection('medical-device').doc(this.formData.device_id).update({
							status: 2,
							updated_at: Date.now()
						})
					);
					promises.push(
						db.collection('medical-device-repair-request').doc(this.formData.repair_request_id).update({
							status: 3,
							handler: this.formData.repair_person,
							handle_date: this.formData.repair_date,
							handle_result: '已修复',
							updated_at: Date.now()
						})
					);
				} else {
					promises.push(
						db.collection('medical-device-repair-request').doc(this.formData.repair_request_id).update({
							status: 2,
							handler: this.formData.repair_person,
							updated_at: Date.now()
						})
					);
					if (this.isEdit) {
						promises.push(
							db.collection('medical-device').doc(this.formData.device_id).update({
								status: 3,
								updated_at: Date.now()
							})
						);
					}
				}
				await Promise.all(promises);
				uni.showToast({ title: this.isEdit ? '修改成功' : '维修记录提交成功', icon: 'success' });
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
.info-card { background: #fff; border-radius: 16rpx; padding: 24rpx 30rpx; margin-bottom: 20rpx; }
.info-title { font-size: 26rpx; font-weight: 600; color: #6366f1; margin-bottom: 16rpx; }
.info-row { display: flex; align-items: center; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f7; &:last-child { border-bottom: none; } }
.info-row-column { padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f7; &:last-child { border-bottom: none; } .label { display: block; margin-bottom: 6rpx; } .value { display: block; } }
.label { width: 160rpx; font-size: 24rpx; color: #94a3b8; flex-shrink: 0; }
.value { flex: 1; font-size: 24rpx; color: #333; word-break: break-all; }
.uni-forms { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.submit-bar { padding: 40rpx 0; }
.btn-submit { background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 24rpx; font-size: 30rpx; }
</style>
