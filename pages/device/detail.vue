<template>
	<view class="page" v-if="device._id">
		<scroll-view scroll-y class="scroll-area">
			<view class="header-card">
				<image v-if="device.image_url" class="device-image" :src="device.image_url" mode="aspectFill" />
				<view class="header-info">
					<view class="header-title">
						<text class="device-name">{{ device.name }}</text>
						<text class="device-short-name" v-if="device.short_name">（{{ device.short_name }}）</text>
					</view>
					<text class="device-code">编号: {{ device.code }}</text>
					<view class="header-tags">
						<uni-tag :text="getStatusText(device.status)" :type="getStatusType(device.status)" size="small" />
						<uni-tag :text="getManagementTypeText(device.management_type)" :type="getManagementTypeType(device.management_type)" size="small" />
					</view>
				</view>
			</view>

			<!-- 设备图片 -->
			<view class="image-section" v-if="device.image_url" @click="previewImage">
				<image class="full-image" :src="device.image_url" mode="aspectFill" />
			</view>

			<!-- 基本信息 -->
			<view class="section-title">基本信息</view>
			<view class="info-section">
				<view class="info-row"><text class="label">品牌</text><text class="value">{{ device.brand }}</text></view>
				<view class="info-row"><text class="label">规格型号</text><text class="value">{{ device.model }}</text></view>
				<view class="info-row"><text class="label">厂家</text><text class="value">{{ device.manufacturer || '-' }}</text></view>
				<view class="info-row"><text class="label">设备分类</text><text class="value">{{ device.category_name || '-' }}</text></view>
				<view class="info-row"><text class="label">适用范围</text><text class="value">{{ device.applicable_scope || '-' }}</text></view>
			</view>

			<!-- 使用位置 -->
			<view class="section-title">使用信息</view>
			<view class="info-section">
				<view class="info-row"><text class="label">使用部门</text><text class="value">{{ device.dept_name || '-' }}</text></view>
				<view class="info-row"><text class="label">存放位置</text><text class="value">{{ device.location_name || '-' }}</text></view>
				<view class="info-row"><text class="label">设备负责人</text><text class="value">{{ device.person_in_charge || '-' }}</text></view>
			</view>

			<!-- 资质信息 -->
			<view class="section-title">资质信息</view>
			<view class="info-section">
				<view class="info-row"><text class="label">注册证/备案号</text><text class="value">{{ device.spec || '-' }}</text></view>
				<view class="info-row"><text class="label">产品编号</text><text class="value">{{ device.serial_no || '-' }}</text></view>
			</view>

			<!-- 采购信息 -->
			<view class="section-title">采购信息</view>
			<view class="info-section">
				<view class="info-row"><text class="label">采购日期</text><text class="value">{{ formatDate(device.purchase_date) }}</text></view>
				<view class="info-row"><text class="label">采购金额</text><text class="value">{{ formatAmount(device.purchase_amount) }}</text></view>
				<view class="info-row"><text class="label">供应商</text><text class="value">{{ device.supplier || '-' }}</text></view>
				<view class="info-row"><text class="label">验收日期</text><text class="value">{{ formatDate(device.acceptance_date) }}</text></view>
			</view>

			<!-- 质保信息 -->
			<view class="section-title">质保信息</view>
			<view class="info-section">
				<view class="info-row"><text class="label">生产日期</text><text class="value">{{ formatDate(device.manufacture_date) }}</text></view>
				<view class="info-row"><text class="label">使用年限</text><text class="value">{{ device.service_life ? device.service_life + '年' : '-' }}</text></view>
				<view class="info-row"><text class="label">保修年限</text><text class="value">{{ device.warranty_years ? device.warranty_years + '年' : '-' }}</text></view>
				<view class="info-row"><text class="label">保修截止</text><text class="value">{{ formatDate(device.warranty_end) }}</text></view>
			</view>

			<!-- 其他 -->
			<view class="info-section" v-if="device.remark || device.qr_code">
				<view class="info-row" v-if="device.remark"><text class="label">备注</text><text class="value">{{ device.remark }}</text></view>
				<view class="info-row" v-if="device.qr_code"><text class="label">二维码</text><text class="value">{{ device.qr_code }}</text></view>
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
const managementTypeMap = {
	1: { text: '一类', type: 'primary' },
	2: { text: '二类', type: 'success' },
	3: { text: '三类', type: 'warning' },
	4: { text: '非医疗器械', type: 'default' }
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
		getManagementTypeText(t) { return managementTypeMap[t]?.text || '未知' },
		getManagementTypeType(t) { return managementTypeMap[t]?.type || 'default' },
		formatDate(ts) {
			if (!ts) return '-'
			const d = new Date(ts)
			return d.getFullYear() + '年' + String(d.getMonth() + 1).padStart(2, '0') + '月' + String(d.getDate()).padStart(2, '0') + '日'
		},
		formatAmount(v) { return v != null ? '¥' + v.toLocaleString('zh-CN') : '-' },
		previewImage() {
			uni.previewImage({ urls: [this.device.image_url] })
		},
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
.header-card {
	display: flex; padding: 30rpx; background: #fff; gap: 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
}
.device-image { width: 200rpx; height: 200rpx; border-radius: 12rpx; background: #f0f0f0; }
.image-section { background: #fff; padding: 20rpx 30rpx; }
.full-image { width: 100%; height: 360rpx; border-radius: 12rpx; background: #f0f0f0; }
.header-info { flex: 1; display: flex; flex-direction: column; gap: 10rpx; }
.header-title { display: flex; align-items: baseline; gap: 8rpx; flex-wrap: wrap; }
.device-name { font-size: 36rpx; font-weight: 700; color: #1e293b; }
.device-short-name { font-size: 26rpx; color: #94a3b8; }
.device-code { font-size: 26rpx; color: #94a3b8; }
.header-tags { display: flex; gap: 12rpx; flex-wrap: wrap; }
.section-title {
	font-size: 26rpx; color: #6366f1; font-weight: 600;
	padding: 24rpx 30rpx 8rpx; letter-spacing: 1rpx;
}
.info-section { background: #fff; padding: 0 30rpx; }
.info-row {
	display: flex; padding: 20rpx 0;
	border-bottom: 1rpx solid #f5f5f7;
	&:last-child { border-bottom: none; }
}
.label { width: 160rpx; font-size: 26rpx; color: #94a3b8; flex-shrink: 0; }
.value { flex: 1; font-size: 26rpx; color: #333; word-break: break-all; }
.action-bar { display: flex; gap: 20rpx; padding: 30rpx; }
.btn-primary { flex: 1; background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
.btn-outline { flex: 1; background: #fff; color: #6366f1; border: 2rpx solid #6366f1; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
</style>
