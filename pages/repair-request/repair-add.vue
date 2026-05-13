<template>
	<view class="page">
		<view class="info-card">
			<view class="info-title">报修信息</view>
			<view class="info-row"><text class="label">设备名称</text><text class="value">{{ deviceName }}</text></view>
			<view class="info-row"><text class="label">故障描述</text><text class="value">{{ faultDescription }}</text></view>
		</view>
		<uni-forms ref="form" :modelValue="formData" :rules="rules">
			<uni-forms-item label="维修结果" name="result">
				<uni-data-select v-model="formData.result" :localdata="resultOptions" placeholder="请选择维修结果" />
			</uni-forms-item>
			<uni-forms-item label="维修日期" name="repair_date">
				<uni-datetime-picker v-model="formData.repair_date" return-type="timestamp" placeholder="请选择维修日期" />
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
			<button class="btn-submit" @click="submit" :loading="submitting">提交维修记录</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command
export default {
	data() {
		return {
			requestId: '',
			deviceId: '',
			deviceName: '',
			faultDescription: '',
			formData: {
				result: 1,
				repair_date: Date.now(),
				fault_reason: '',
				repair_method: '',
				repair_person: '',
				repair_company: '',
				cost: '',
				remark: ''
			},
			resultOptions: [
				{ value: 1, text: '已修复' },
				{ value: 2, text: '部分修复' },
				{ value: 3, text: '无法修复' }
			],
			submitting: false,
			rules: {
				result: { rules: [{ required: true, errorMessage: '请选择维修结果' }] },
				repair_date: { rules: [{ required: true, errorMessage: '请选择维修日期' }] }
			}
		}
	},
	onLoad(e) {
		this.requestId = e.request_id || ''
		this.deviceId = e.device_id || ''
		this.deviceName = e.device_name || ''
		this.faultDescription = e.fault_description ? decodeURIComponent(e.fault_description) : ''
	},
	methods: {
		async submit() {
			this.$refs.form.validate().then(async () => {
				this.submitting = true
				try {
					const cost = this.formData.cost ? parseFloat(this.formData.cost) : 0
					await db.collection('medical-device-repair').add({
						device_id: this.deviceId,
						repair_request_id: this.requestId,
						repair_date: this.formData.repair_date,
						result: this.formData.result,
						fault_reason: this.formData.fault_reason,
						repair_method: this.formData.repair_method,
						repair_person: this.formData.repair_person,
						repair_company: this.formData.repair_company,
						cost: cost,
						remark: this.formData.remark,
						deleted: 0
					})
					const requestUpdate = {
						updated_at: Date.now()
					}
					const deviceUpdate = {
						updated_at: Date.now()
					}
					if (this.formData.result === 1) {
						requestUpdate.status = 3
						requestUpdate.handler = this.formData.repair_person
						requestUpdate.handle_date = this.formData.repair_date
						requestUpdate.handle_result = '已修复'
						const deviceRes = await db.collection('medical-device').doc(this.deviceId).field('previous_status').get()
						const previousStatus = deviceRes.result.data[0]?.previous_status || 2
						deviceUpdate.status = previousStatus
						deviceUpdate.previous_status = dbCmd.remove()
					} else {
						requestUpdate.status = 2
						requestUpdate.handler = this.formData.repair_person
					}
					await Promise.all([
						db.collection('medical-device-repair-request').doc(this.requestId).update(requestUpdate),
						db.collection('medical-device').doc(this.deviceId).update(deviceUpdate)
					])
					uni.showToast({ title: '维修记录提交成功', icon: 'success' })
					setTimeout(() => uni.navigateBack(), 1500)
				} catch (e) {
					console.error(e)
					uni.showToast({ title: e.message || '提交失败', icon: 'none' })
				} finally {
					this.submitting = false
				}
			}).catch(() => {})
		}
	}
}
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; padding: 20rpx; }
.info-card { background: #fff; border-radius: 16rpx; padding: 24rpx 30rpx; margin-bottom: 20rpx; }
.info-title { font-size: 26rpx; font-weight: 600; color: #6366f1; margin-bottom: 16rpx; }
.info-row { display: flex; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f7; &:last-child { border-bottom: none; } }
.label { width: 160rpx; font-size: 24rpx; color: #94a3b8; flex-shrink: 0; }
.value { flex: 1; font-size: 24rpx; color: #333; word-break: break-all; }
.uni-forms { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.submit-bar { padding: 40rpx 0; }
.btn-submit { background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 24rpx; font-size: 30rpx; }
</style>
