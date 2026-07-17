<template>
	<view class="pages">
		<view class="search-bar">
			<uni-search-bar v-model="keyword" radius="100" cancelButton="none" placeholder="搜索设备编号/名称" @confirm="search" />
		</view>
		<view class="filter-bar">
			<uni-data-select v-model="filterDept" :localdata="deptOptions" placeholder="全部部门" clear @change="search" />
			<uni-data-select v-model="filterStatus" :localdata="statusOptions" placeholder="全部状态" clear @change="search" />
		</view>
		<unicloud-db ref="udb" collection="medical-device" :where="where" :getcount="true" page-data="add"
			:page-size="30" v-slot:default="{data, pagination, hasMore, loading, error}" @load="onLoad">
			<view class="device-list">
				<view class="device-card" v-for="(item, i) in data" :key="i" @click="toDetail(item)">
					<view class="device-left" :style="{backgroundColor: getStatusColor(item.status)}"></view>
					<view class="device-body">
						<view class="device-top">
							<text class="device-name">{{ item.name }}</text>
							<uni-tag :text="getStatusText(item.status)" :type="getStatusType(item.status)" size="small" />
						</view>
						<view class="device-info">
							<text class="device-code">编号 {{ item.code }}</text>
							<text class="device-brand">{{ item.brand }} {{ item.model }}</text>
						</view>
						<view class="device-meta">
							<text class="meta-item" v-if="item.manufacture_date">生产日期 {{ formatDate(item.manufacture_date) }}</text>
							<text class="meta-item" v-if="item.service_life">使用年限 {{ item.service_life }}年</text>
							<text class="meta-item" v-if="item.person_in_charge">负责人 {{ item.person_in_charge }}</text>
						</view>
						<view class="device-tags">
							<text class="device-tag tag-location" v-if="item.location_id_text">{{ item.location_id_text }}</text>
							<text class="device-tag tag-dept" v-if="item.dept_id_text">{{ item.dept_id_text }}</text>
						</view>
					</view>
				</view>
			</view>
			<uni-load-state :state="{data, pagination, hasMore, loading, error}" @loadMore="loadMore" />
		</unicloud-db>
	</view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command
const statusMap = {
	1: { text: '正常', type: 'success' },
	2: { text: '使用中', type: 'primary' },
	3: { text: '维修中', type: 'warning' },
	4: { text: '报废', type: 'error' },
	5: { text: '未投入', type: 'default' },
	6: { text: '其他', type: 'info' }
}
const managementTypeMap = { 1: '一类', 2: '二类', 3: '三类', 4: '非医疗器械' }
export default {
	data() {
		return {
			keyword: '',
			filterDept: '',
			filterStatus: '',
			where: 'deleted == 0',
			loadingMore: false,
			deptOptions: [],
			statusOptions: Object.entries(statusMap).map(([k, v]) => ({ value: Number(k), text: v.text }))
		}
	},
	onLoad(e) {
		if (e.status) {
			this.filterStatus = Number(e.status)
			this.search()
		}
	},
	onPullDownRefresh() {
		this.$refs.udb?.loadData({ clear: true }).then(() => {
			uni.stopPullDownRefresh()
		}).catch(() => {
			uni.stopPullDownRefresh()
		})
	},
	onReachBottom() {
		if (this.loadingMore) return
		this.loadMore()
	},
	onReady() {
		this.loadDeptOptions()
	},
	methods: {
		async loadDeptOptions() {
			try {
				const res = await db.collection('opendb-department').limit(10000).get()
				this.deptOptions = (res.result.data || []).map(item => ({ value: item._id, text: item.name }))
			} catch (e) { console.error(e) }
		},
		getStatusText(s) { return statusMap[s]?.text || '未知' },
		getStatusType(s) { return statusMap[s]?.type || 'default' },
		formatDate(ts) {
			if (!ts) return '-'
			const d = new Date(ts)
			return d.getFullYear() + '年' + String(d.getMonth() + 1).padStart(2, '0') + '月' + String(d.getDate()).padStart(2, '0') + '日'
		},
		getManagementTypeText(t) { return managementTypeMap[t] || '' },
		getStatusColor(s) {
			const map = { 1: '#10b981', 2: '#3b82f6', 3: '#f59e0b', 4: '#ef4444', 5: '#9ca3af', 6: '#8b5cf6' }
			return map[s] || '#9ca3af'
		},
		search() {
			const cond = ['deleted == 0']
			if (this.keyword.trim()) {
				const q = this.keyword.trim()
				cond.push(`/${q}/.test(name) || /${q}/.test(code) || /${q}/.test(brand) || /${q}/.test(model)`)
			}
			if (this.filterDept) cond.push(`dept_id == "${this.filterDept}"`)
			if (this.filterStatus) cond.push(`status == ${this.filterStatus}`)
			this.where = cond.join(' && ')
			this.$nextTick(() => this.$refs.udb?.loadData({ clear: true }))
		},
		toDetail(item) {
			uni.navigateTo({ url: '/pages/device/detail?id=' + item._id })
		},
		loadMore() {
			if (this.loadingMore || !this.$refs.udb) return
			this.loadingMore = true
			const udb = this.$refs.udb
			udb.loadMore()
			setTimeout(() => {
				this.loadingMore = false
			}, 500)
		},
		onLoad(data) {
			this.loadingMore = false
			if (data && data.length) {
				data.forEach(i => { i.management_type_text = this.getManagementTypeText(i.management_type) })
				const ids = [...new Set(data.map(i => i.location_id).filter(Boolean))]
				const deptIds = [...new Set(data.map(i => i.dept_id).filter(Boolean))]
				Promise.all([
					ids.length ? db.collection('medical-device-location').where({ _id: dbCmd.in(ids) }).get().then(r => {
						const map = Object.fromEntries((r.result.data || []).map(i => [i._id, i.name]))
						data.forEach(i => { if (map[i.location_id]) i.location_id_text = map[i.location_id] })
					}) : Promise.resolve(),
					deptIds.length ? db.collection('opendb-department').where({ _id: dbCmd.in(deptIds) }).get().then(r => {
						const map = Object.fromEntries((r.result.data || []).map(i => [i._id, i.name]))
						data.forEach(i => { if (map[i.dept_id]) i.dept_id_text = map[i.dept_id] })
					}) : Promise.resolve()
				])
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.pages { background-color: #f5f5f7; min-height: 100vh; }
.search-bar { background: #fff; padding: 16rpx 20rpx; }
.filter-bar { display: flex; gap: 16rpx; padding: 0 20rpx 16rpx; background: #fff; }
.device-list { padding: 20rpx; display: flex; flex-direction: column; gap: 16rpx; }
.device-card {
	background: #fff; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	display: flex; overflow: hidden;
	&:active { opacity: 0.85; }
}
.device-left { width: 8rpx; flex-shrink: 0; }
.device-body { flex: 1; padding: 20rpx 20rpx 16rpx; min-width: 0; }
.device-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.device-name { font-size: 30rpx; font-weight: 600; color: #1e293b; flex: 1; margin-right: 12rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.device-info { display: flex; gap: 24rpx; margin-bottom: 10rpx; }
.device-code, .device-brand { font-size: 24rpx; color: #94a3b8; }
.device-meta { display: flex; gap: 16rpx; margin-bottom: 8rpx; flex-wrap: wrap; }
.meta-item { font-size: 22rpx; color: #64748b; }
.device-meta { display: flex; gap: 16rpx; margin-bottom: 8rpx; flex-wrap: wrap; }
.meta-item { font-size: 22rpx; color: #64748b; }
.device-tags { display: flex; gap: 12rpx; flex-wrap: wrap; }
.device-tag { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 8rpx; }
.tag-location { color: #6366f1; background: #eef2ff; }
.tag-dept { color: #0891b2; background: #ecfeff; }
</style>
