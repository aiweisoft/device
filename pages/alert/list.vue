<template>
	<view class="page">
		<unicloud-db ref="udb" collection="medical-device-alert" :where="where" page-data="replace" :getcount="true"
			:page-size="20" :orderby="'alert_date desc'" v-slot:default="{data, pagination, hasMore, loading, error}">
			<uni-list class="list" :border="false">
				<uni-list-item v-for="(item, i) in data" :key="i" @click="markRead(item)">
					<template v-slot:body>
						<view class="alert-item">
							<view class="alert-top">
								<view class="alert-left">
									<view class="alert-dot" :class="item.is_read ? 'dot-read' : 'dot-unread'"></view>
									<text class="alert-title" :class="item.is_read ? 'title-read' : 'title-unread'">{{ item.title }}</text>
								</view>
								<uni-dateformat :date="item.alert_date" format="MM-dd HH:mm" />
							</view>
							<text class="alert-desc">{{ item.description }}</text>
							<view class="alert-bottom">
								<uni-tag :text="getTypeText(item.alert_type)" :type="getTypeType(item.alert_type)" size="small" />
								<text class="alert-device" v-if="item.device_name">{{ item.device_name }}</text>
							</view>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
			<uni-load-state :state="{data, pagination, hasMore, loading, error}" @loadMore="loadMore" />
		</unicloud-db>
	</view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command
const typeMap = {
	1: { text: '保养到期', type: 'warning' },
	2: { text: '校准到期', type: 'primary' },
	3: { text: '维修提醒', type: 'error' },
	4: { text: '其他', type: 'default' }
}
export default {
	data() {
		return {
			where: 'deleted == 0'
		}
	},
	computed: {
		hasLogin() {
			return uniCloud.getCurrentUserInfo().tokenExpired > Date.now()
		}
	},
	onReady() {
		this.$refs.udb?.loadData()
	},
	methods: {
		getTypeText(t) { return typeMap[t]?.text || '未知' },
		getTypeType(t) { return typeMap[t]?.type || 'default' },
		loadMore() { this.$refs.udb?.loadMore() },
		markRead(item) {
			if (item.is_read) return
			db.collection('medical-device-alert').doc(item._id).update({ is_read: 1, read_date: Date.now() }).then(() => {
				item.is_read = 1
			})
		},
		onLoad(data) {
			if (data && data.length) {
				const ids = [...new Set(data.map(i => i.device_id).filter(Boolean))]
				if (ids.length) {
					db.collection('medical-device').where({ _id: dbCmd.in(ids) }).get().then(r => {
						const map = Object.fromEntries((r.result.data || []).map(i => [i._id, i.name]))
						data.forEach(i => { i.device_name = map[i.device_id] || '' })
					})
				}
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; }
.list { padding: 0 20rpx; }
.alert-item { display: flex; flex-direction: column; gap: 8rpx; padding: 6rpx 0; }
.alert-top { display: flex; justify-content: space-between; align-items: center; }
.alert-left { display: flex; align-items: center; gap: 12rpx; flex: 1; }
.alert-dot { width: 14rpx; height: 14rpx; border-radius: 50%; flex-shrink: 0; }
.dot-unread { background-color: #ef4444; }
.dot-read { background-color: #d1d5db; }
.alert-title { font-size: 28rpx; }
.title-unread { font-weight: 600; color: #1e293b; }
.title-read { color: #94a3b8; }
.alert-desc { font-size: 24rpx; color: #666; margin-left: 26rpx; }
.alert-bottom { display: flex; gap: 16rpx; align-items: center; margin-left: 26rpx; }
.alert-device { font-size: 22rpx; color: #6366f1; }
</style>
