<template>
	<view class="page">
		<view class="tabs">
			<view class="tab" :class="tabActive === 0 ? 'tab-active' : ''" @click="switchTab(0)">我的报修</view>
			<view class="tab" :class="tabActive === 1 ? 'tab-active' : ''" @click="switchTab(1)">维修记录</view>
		</view>
		<unicloud-db ref="udb" :collection="collectionName" :where="where" page-data="replace" :getcount="true"
			:page-size="15" v-slot:default="{data, pagination, hasMore, loading, error}" @load="onLoad">
			<uni-list class="list" :border="false">
				<uni-list-item v-for="(item, i) in data" :key="i">
					<template v-slot:body>
						<view class="item">
							<view class="item-top">
								<text class="item-device">{{ item.device_name || '未知设备' }}</text>
								<uni-tag v-if="item.status_text" :text="item.status_text" :type="item.status_type" size="small" />
							</view>
							<text class="item-desc">{{ item.fault_description }}</text>
							<view class="item-meta">
								<text class="item-date">{{ formatDate(item.created_at) }}</text>
								<text class="item-urgency" v-if="item.urgency">紧急: {{ ['','一般','紧急','非常紧急'][item.urgency] }}</text>
							</view>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
			<uni-load-state :state="{data, pagination, hasMore, loading, error}" @loadMore="loadMore" />
		</unicloud-db>
		<view class="fab" @click="toAdd">
			<uni-icons type="plusempty" size="28" color="#fff"></uni-icons>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command
import {
	store
} from '@/uni_modules/uni-id-pages/common/store.js'
const statusMap = {
	1: { text: '待处理', type: 'warning' },
	2: { text: '处理中', type: 'primary' },
	3: { text: '已完成', type: 'success' },
	4: { text: '已关闭', type: 'info' }
}
export default {
	data() {
		const uid = store.userInfo?._id || ''
		return {
			tabActive: 0,
			where: uid ? 'deleted == 0 && creator == "' + uid + '"' : 'deleted == 0',
			deviceId: ''
		}
	},
	computed: {
		collectionName() {
			return this.tabActive === 0 ? 'medical-device-repair-request' : 'medical-device-repair'
		},
		uid() {
			return store.userInfo?._id || ''
		}
	},
	onLoad(e) {
		this.where = 'deleted == 0 && creator == "' + this.uid + '"'
		if (e.device_id) {
			this.deviceId = e.device_id
			this.where += ' && device_id == "' + e.device_id + '"'
		}
	},
	methods: {
		switchTab(i) {
			this.tabActive = i
			let where = 'deleted == 0 && creator == "' + this.uid + '"'
			if (this.deviceId) where += ' && device_id == "' + this.deviceId + '"'
			this.where = where
		},
		loadMore() { this.$refs.udb?.loadMore() },
		toAdd() { uni.navigateTo({ url: '/pages/repair-request/add' + (this.deviceId ? '?device_id=' + this.deviceId : '') }) },
		formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('zh-CN') : '' },
		onLoad(data) {
			if (data && data.length) {
				const ids = [...new Set(data.map(i => i.device_id).filter(Boolean))]
				if (ids.length) {
					db.collection('medical-device').where({ _id: dbCmd.in(ids) }).get().then(r => {
						const map = Object.fromEntries((r.result.data || []).map(i => [i._id, i.name]))
						data.forEach(i => { i.device_name = map[i.device_id] || '未知' })
					})
				}
				if (this.tabActive === 0) {
					data.forEach(i => {
						const s = statusMap[i.status]
						i.status_text = s?.text || '未知'
						i.status_type = s?.type || 'default'
					})
				}
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; }
.tabs { display: flex; background: #fff; padding: 0 30rpx; }
.tab { padding: 24rpx 30rpx; font-size: 28rpx; color: #666; border-bottom: 4rpx solid transparent; }
.tab-active { color: #6366f1; border-bottom-color: #6366f1; font-weight: 600; }
.list { padding: 0 20rpx; }
.item { display: flex; flex-direction: column; gap: 8rpx; padding: 6rpx 0; }
.item-top { display: flex; justify-content: space-between; align-items: center; }
.item-device { font-size: 28rpx; font-weight: 600; color: #1e293b; }
.item-desc { font-size: 24rpx; color: #666; }
.item-meta { display: flex; gap: 20rpx; }
.item-date, .item-urgency { font-size: 22rpx; color: #94a3b8; }
.fab { position: fixed; right: 40rpx; bottom: 40rpx; width: 100rpx; height: 100rpx; background: #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4rpx 16rpx rgba(99,102,241,0.4); }

</style>
