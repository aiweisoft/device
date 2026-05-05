<template>
	<view class="page">
		<uni-forms ref="form" :modelValue="formData" :rules="rules">
			<uni-forms-item label="设备" name="device_id">
				<uni-data-select v-model="formData.device_id" :localdata="deviceOptions" placeholder="请选择设备" @change="onDeviceChange" />
			</uni-forms-item>
			<uni-forms-item label="故障描述" name="fault_description">
				<uni-easyinput type="textarea" v-model="formData.fault_description" placeholder="请描述设备故障现象" />
			</uni-forms-item>
			<uni-forms-item label="紧急程度" name="urgency">
				<uni-data-select v-model="formData.urgency" :localdata="urgencyOptions" placeholder="请选择紧急程度" />
			</uni-forms-item>
			<uni-forms-item label="联系电话" name="phone">
				<uni-easyinput v-model="formData.phone" placeholder="请输入联系电话" type="number" />
			</uni-forms-item>
			<uni-forms-item label="备注">
				<uni-easyinput type="textarea" v-model="formData.remark" placeholder="其他说明（选填）" />
			</uni-forms-item>
		</uni-forms>
		<view class="submit-bar">
			<button class="btn-submit" @click="submit" :loading="submitting">提交报修</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database()
export default {
	data() {
		return {
			formData: { device_id: '', fault_description: '', urgency: 1, phone: '', remark: '' },
			deviceOptions: [],
			urgencyOptions: [
				{ value: 1, text: '一般' },
				{ value: 2, text: '紧急' },
				{ value: 3, text: '非常紧急' }
			],
			submitting: false,
			rules: {
				device_id: { rules: [{ required: true, errorMessage: '请选择设备' }] },
				fault_description: { rules: [{ required: true, errorMessage: '请描述故障现象' }] },
				phone: { rules: [{ pattern: /^1\d{10}$/, errorMessage: '请输入正确的手机号' }] }
			}
		}
	},
	onLoad(e) {
		if (e.device_id) {
			this.formData.device_id = e.device_id
		}
		this.loadDevices()
	},
	methods: {
		async loadDevices() {
			try {
				const res = await db.collection('medical-device').where('deleted == 0').field('_id,name,code').get()
				this.deviceOptions = (res.result.data || []).map(i => ({ value: i._id, text: i.name + ' (' + i.code + ')' }))
			} catch (e) { console.error(e) }
		},
		onDeviceChange(v) {},
		async submit() {
			this.$refs.form.validate().then(async () => {
				this.submitting = true
				try {
					await db.collection('medical-device-repair-request').add({
						device_id: this.formData.device_id,
						fault_description: this.formData.fault_description,
						urgency: this.formData.urgency,
						phone: this.formData.phone,
						remark: this.formData.remark,
						request_date: Date.now(),
						status: 1,
						deleted: 0,
						created_at: Date.now(),
						updated_at: Date.now()
					})
					uni.showToast({ title: '报修提交成功', icon: 'success' })
					setTimeout(() => uni.navigateBack(), 1500)
				} catch (e) {
					console.error(e)
					uni.showToast({ title: '提交失败', icon: 'none' })
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
.uni-forms { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.submit-bar { padding: 40rpx 0; }
.btn-submit { background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 24rpx; font-size: 30rpx; }
</style>
