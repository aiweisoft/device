<template>
	<view class="page">
		<!-- #ifdef APP-PLUS || H5 -->
		<view class="scanner-container">
			<text class="scan-tip">将二维码对准扫描区域</text>
			<view class="scan-frame">
				<view class="scan-line"></view>
			</view>
			<text class="scan-result" v-if="result">识别结果: {{ result }}</text>
			<button class="btn-input" @click="manualInput">手动输入设备编号</button>
		</view>
		<!-- #endif -->
		<!-- #ifndef APP-PLUS -->
		<view class="no-support">
			<text class="scan-icon-font">&#xe62a;</text>
			<text class="no-support-text">当前平台不支持扫码</text>
			<button class="btn-input" @click="manualInput">手动输入设备编号</button>
		</view>
		<!-- #endif -->
	</view>
</template>

<script>
export default {
	data() {
		return { result: '' }
	},
	onLoad() {
		// #ifdef APP-PLUS
		this.startScan()
		// #endif
	},
	methods: {
		startScan() {
			// #ifdef APP-PLUS
			const scan = plus.barcode.create('barcode', { top: '10%', left: '5%', width: '90%', height: '60%' }, types => {
				const code = scan.getText()
				this.result = code
				this.handleCode(code)
			})
			// #endif
		},
		handleCode(code) {
			if (!code) return
			uni.showLoading({ title: '查询设备...' })
			const db = uniCloud.database()
			db.collection('medical-device').where(`qr_code == "${code}" || code == "${code}"`).get().then(res => {
				uni.hideLoading()
				const data = res.result.data[0]
				if (data) {
					uni.navigateTo({ url: '/pages/device/detail?id=' + data._id })
				} else {
					uni.showModal({ title: '提示', content: '未找到该设备', showCancel: false })
				}
			}).catch(() => {
				uni.hideLoading()
				uni.showToast({ title: '查询失败', icon: 'none' })
			})
		},
		manualInput() {
			uni.showModal({
				title: '输入设备编号',
				content: '',
				editable: true,
				placeholderText: '请输入设备编号或二维码内容',
				success: (res) => {
					if (res.confirm && res.content) {
						this.handleCode(res.content.trim())
					}
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page { background: #000; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.scan-tip { color: #fff; font-size: 28rpx; margin-bottom: 40rpx; }
.scan-frame { width: 500rpx; height: 500rpx; border: 4rpx solid rgba(99,102,241,0.8); border-radius: 20rpx; position: relative; overflow: hidden; }
.scan-line { width: 100%; height: 4rpx; background: #6366f1; position: absolute; top: 0; animation: scanMove 2s ease-in-out infinite; }
@keyframes scanMove { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
.scan-result { color: #fff; margin-top: 30rpx; font-size: 24rpx; }
.btn-input { margin-top: 40rpx; background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 20rpx 60rpx; font-size: 28rpx; }
.no-support { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 30rpx; }
.no-support-text { font-size: 28rpx; color: #999; }
.scan-icon-font { font-family: uniicons; font-size: 80rpx; color: #6366f1; }
</style>
