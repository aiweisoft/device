<template>
	<view class="page" v-if="device._id">
		<scroll-view scroll-y class="scroll-area">
			<view class="header-card">
				<image v-if="device.image_url" class="device-image" :src="device.image_url" mode="aspectFill" />
				<view class="header-info">
					<text class="device-name">{{ device.name }}</text>
					<text class="device-code">设备编号: {{ device.code }}</text>
					<uni-tag :text="getStatusText(device.status)" :type="getStatusType(device.status)" size="small" />
				</view>
			</view>

			<view class="info-section">
				<view class="info-row"><text class="label">品牌</text><text class="value">{{ device.brand }}</text></view>
				<view class="info-row"><text class="label">规格型号</text><text class="value">{{ device.model }}</text></view>
				<view class="info-row"><text class="label">厂家</text><text class="value">{{ device.manufacturer || '-' }}</text></view>
				<view class="info-row"><text class="label">设备分类</text><text class="value">{{ device.category_name || '-' }}</text></view>
				<view class="info-row"><text class="label">使用部门</text><text class="value">{{ device.dept_name || '-' }}</text></view>
				<view class="info-row"><text class="label">存放位置</text><text class="value">{{ device.location_name || '-' }}</text></view>
				<view class="info-row"><text class="label">设备负责人</text><text class="value">{{ device.person_in_charge || '-' }}</text></view>
				<view class="info-row"><text class="label">注册证号</text><text class="value">{{ device.spec || '-' }}</text></view>
				<view class="info-row"><text class="label">序列号</text><text class="value">{{ device.serial_no || '-' }}</text></view>
				<view class="info-row"><text class="label">采购日期</text><text class="value">{{ formatDate(device.purchase_date) }}</text></view>
				<view class="info-row"><text class="label">供应商</text><text class="value">{{ device.supplier || '-' }}</text></view>
				<view class="info-row"><text class="label">保修截止</text><text class="value">{{ formatDate(device.warranty_end) }}</text></view>
				<view class="info-row"><text class="label">生产日期</text><text class="value">{{ formatDate(device.manufacture_date) }}</text></view>
				<view class="info-row"><text class="label">使用年限</text><text class="value">{{ device.service_life ? device.service_life + '年' : '-' }}</text></view>
			</view>

			<view class="action-bar">
				<button class="btn-primary" @click="toRepair">发起报修</button>
				<button class="btn-outline" @click="toRepairHistory">维修记录</button>
			</view>
		</scroll-view>
	</view>
</template>

<script>
const db = uniCloud.database()
const statusMap = {
	1: { text: '正常', type: 'success' }, 2: { text: '使用中', type: 'primary' },
	3: { text: '维修中', type: 'warning' }, 4: { text: '报废', type: 'error' },
	5: { text: '未投入', type: 'default' }, 6: { text: '其他', type: 'info' }
}
export default {
	data() {
		return { device: {} }
	},
	onLoad(e) {
		if (e.id) this.loadDetail(e.id)
	},
	methods: {
		async loadDetail(id) {
			try {
				const res = await db.collection('medical-device').doc(id).get()
				const data = res.result.data[0]
				if (!data) return uni.showToast({ title: '设备不存在', icon: 'none' })
				this.device = data
				const promises = []
				if (data.category_id) {
					promises.push(db.collection('medical-device-category').doc(data.category_id).get().then(r => {
						this.device.category_name = r.result.data[0]?.name
					}))
				}
				if (data.dept_id) {
					promises.push(db.collection('opendb-department').doc(data.dept_id).get().then(r => {
						this.device.dept_name = r.result.data[0]?.name
					}))
				}
				if (data.location_id) {
					promises.push(db.collection('medical-device-location').doc(data.location_id).get().then(r => {
						this.device.location_name = r.result.data[0]?.name
					}))
				}
				await Promise.all(promises)
			} catch (e) {
				console.error(e)
				uni.showToast({ title: '加载失败', icon: 'none' })
			}
		},
		getStatusText(s) { return statusMap[s]?.text || '未知' },
		getStatusType(s) { return statusMap[s]?.type || 'default' },
		formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('zh-CN') : '-' },
		toRepair() {
			uni.navigateTo({ url: '/pages/repair-request/add?device_id=' + this.device._id + '&device_name=' + this.device.name })
		},
		toRepairHistory() {
			uni.navigateTo({ url: '/pages/repair-request/list?device_id=' + this.device._id })
		}
	}
}
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; }
.scroll-area { height: 100vh; }
.header-card { display: flex; padding: 30rpx; background: #fff; gap: 24rpx; }
.device-image { width: 200rpx; height: 200rpx; border-radius: 12rpx; background: #f0f0f0; }
.header-info { flex: 1; display: flex; flex-direction: column; gap: 12rpx; }
.device-name { font-size: 36rpx; font-weight: 700; color: #1e293b; }
.device-code { font-size: 26rpx; color: #94a3b8; }
.info-section { background: #fff; margin-top: 16rpx; padding: 0 30rpx; }
.info-row { display: flex; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.label { width: 160rpx; font-size: 26rpx; color: #94a3b8; flex-shrink: 0; }
.value { flex: 1; font-size: 26rpx; color: #333; }
.action-bar { display: flex; gap: 20rpx; padding: 30rpx; }
.btn-primary { flex: 1; background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
.btn-outline { flex: 1; background: #fff; color: #6366f1; border: 2rpx solid #6366f1; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
</style>
