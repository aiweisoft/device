<template>
	<view class="warp">
		<!-- 下拉刷新指示器（APP/小程序） -->
		<uni-load-more v-if="refreshing" status="loading" :content-text="loadText"></uni-load-more>

		<view class="header">
			<view class="header-top">
				<view>
					<text class="header-greeting">{{ greeting }}</text>
					<text class="header-subtitle">医疗设备全生命周期管理</text>
				</view>
				<view class="header-user" @click="toUserOrLogin">
					<view class="header-avatar">
						<text class="header-icon-font">&#xe69d;</text>
					</view>
					<text class="header-username">{{ userName || '请登录' }}</text>
				</view>
			</view>
		</view>

		<!-- 统计卡片 -->
		<view class="stats-grid">
			<view class="stat-card" v-for="(item, i) in stats" :key="i" @click="navigateToStat(item)">
				<view class="stat-icon-box" :style="{backgroundColor: item.bgColor}">
					<text class="stat-icon" :style="{color: item.color}">{{ icons[item.label] }}</text>
				</view>
				<view class="stat-body">
					<text class="stat-number" :style="{color: item.color}">{{ loading ? '--' : item.count }}</text>
					<text class="stat-label">{{ item.label }}</text>
				</view>
			</view>
		</view>

		<!-- 快捷操作 -->
		<view class="quick-actions">
			<view class="section-title">
				<text class="section-title-text">快捷操作</text>
			</view>
			<uni-grid :column="4" :highlight="false" :showBorder="false">
				<uni-grid-item v-for="(item, i) in actions" :key="i" @click="execAction(item.action)">
					<view class="action-item">
						<view class="action-icon" :style="{backgroundColor: item.bgColor}">
							<text class="action-icon-font">{{ item.uni }}</text>
						</view>
						<text class="action-text">{{ item.label }}</text>
					</view>
				</uni-grid-item>
			</uni-grid>
		</view>

		<!-- 加载骨架 -->
		<view class="alert-section empty-section" v-if="loading">
			<view class="section-title">
				<text class="section-title-text">待处理提醒</text>
			</view>
			<view class="empty-state">
				<text class="empty-text">加载中...</text>
			</view>
		</view>

		<!-- 待处理提醒 -->
		<view class="alert-section" v-else-if="!error && recentAlerts.length">
			<view class="section-title">
				<text class="section-title-text">待处理提醒 <text class="alert-badge">{{ recentAlerts.length }}</text></text>
				<text class="section-more" @click="toAlerts">查看全部</text>
			</view>
			<view class="alert-list">
				<view class="alert-item" v-for="(item, i) in recentAlerts" :key="i" @click="toAlertDetail(item)">
					<view class="alert-dot" :class="item.is_read ? 'dot-read' : 'dot-unread'"></view>
					<view class="alert-content">
						<text class="alert-title">{{ item.title }}</text>
						<text class="alert-desc">{{ item.description || item.content }}</text>
					</view>
					<uni-dateformat :date="item.alert_date || item.create_date" format="MM-dd" :threshold="[86400000, 604800000]" />
				</view>
			</view>
		</view>

		<!-- 提醒空状态 -->
		<view class="alert-section empty-section" v-else-if="!error">
			<view class="section-title">
				<text class="section-title-text">待处理提醒</text>
			</view>
			<view class="empty-state">
				<text class="empty-icon-font">&#xe62c;</text>
				<text class="empty-text">暂无待处理提醒</text>
			</view>
		</view>

		<!-- 错误状态 -->
		<view class="alert-section empty-section" v-else>
			<view class="section-title">
				<text class="section-title-text">数据加载失败</text>
			</view>
			<view class="empty-state" @click="refreshAll">
				<text class="empty-icon-font">&#xe657;</text>
				<text class="empty-text retry-text">点击重试</text>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database()
import {
	store
} from '@/uni_modules/uni-id-pages/common/store.js'
export default {
	data() {
		return {
			loading: false,
			refreshing: false,
			error: false,
			loadText: {
				contentdown: '',
				contentrefresh: '加载中...',
				contentnomore: ''
			},
			stats: [
				{ label: '设备总数', count: 0, color: '#4f46e5', bgColor: '#eef2ff', icon: 'list', status: '' },
				{ label: '使用中', count: 0, color: '#059669', bgColor: '#ecfdf5', icon: 'checkmarkempty', status: 2 },
				{ label: '维修中', count: 0, color: '#d97706', bgColor: '#fffbeb', icon: 'undo', status: 3 },
				{ label: '待处理报修', count: 0, color: '#dc2626', bgColor: '#fef2f2', icon: 'paperplane', status: 'pending-repair' },
				{ label: '待保养', count: 0, color: '#0891b2', bgColor: '#ecfeff', icon: 'calendar', status: 'pending-maintenance' }
			],
			actions: [
				{ label: '扫一扫', uni: '\ue62a', bgColor: '#6366f1', action: 'toScan' },
				{ label: '设备列表', uni: '\ue644', bgColor: '#10b981', action: 'toDeviceList' },
				{ label: '提交报修', uni: '\ue672', bgColor: '#f59e0b', action: 'toAddRepair' },
				{ label: '我的报修', uni: '\ue696', bgColor: '#8b5cf6', action: 'toRepairs' },
				{ label: '保养提醒', uni: '\ue6a6', bgColor: '#ef4444', action: 'toAlerts' },
				{ label: '维修记录', uni: '\ue654', bgColor: '#06b6d4', action: 'toRepairHistory' },
				{ label: '扫码记录', uni: '\ue651', bgColor: '#f97316', action: 'toScanHistory' },
				{ label: '个人中心', uni: '\ue699', bgColor: '#14b8a6', action: 'toProfile' }
			],
			recentAlerts: [],
			icons: {
				'设备总数': '\ue644',
				'使用中': '\ue65c',
				'维修中': '\ue64f',
				'待处理报修': '\ue672',
				'待保养': '\ue6a6'
			}
		}
	},
	computed: {
		userName() {
			const info = store.userInfo
			return info && (info.nickname || info.username || info.mobile)
		},
		greeting() {
			const h = new Date().getHours()
			let g = '下午好'
			if (h < 6) g = '夜深了'
			else if (h < 9) g = '早上好'
			else if (h < 12) g = '上午好'
			else if (h < 14) g = '中午好'
			else if (h < 18) g = '下午好'
			else g = '晚上好'
			return g + '，欢迎使用<设备管家>'
		},
		hasLogin() {
			return uniCloud.getCurrentUserInfo().tokenExpired > Date.now()
		}
	},
	onShow() {
		this.refreshAll()
	},
	onPullDownRefresh() {
		this.refreshing = true
		this.refreshAll().then(() => {
			this.refreshing = false
			uni.stopPullDownRefresh()
		}).catch(() => {
			this.refreshing = false
			uni.stopPullDownRefresh()
		})
	},
	methods: {
		async refreshAll() {
			this.error = false
			this.loading = true
			try {
				await Promise.all([this.loadStats(), this.loadRecentAlerts()])
			} catch (e) {
				console.error('refreshAll error:', e)
				this.error = true
			} finally {
				this.loading = false
			}
		},
		async loadStats() {
			try {
				const now = Date.now()
				const [
					totalRes,
					normalRes,
					repairRes,
					pendingRepairRes,
					pendingMaintRes
				] = await Promise.all([
					db.collection('medical-device').where('deleted == 0').count(),
					db.collection('medical-device').where('deleted == 0 && status == 2').count(),
					db.collection('medical-device').where('deleted == 0 && status == 3').count(),
					db.collection('medical-device-repair-request').where('deleted == 0 && status == 1').count(),
					db.collection('medical-device-maintenance').where('status != 2 && plan_date < ' + now).count()
				])
				const getCount = (res) => res?.total ?? res?.result?.total ?? 0
				this.stats = [
					{ label: '设备总数', count: getCount(totalRes), color: '#4f46e5', bgColor: '#eef2ff', icon: 'list', status: '' },
					{ label: '使用中', count: getCount(normalRes), color: '#059669', bgColor: '#ecfdf5', icon: 'checkmarkempty', status: 2 },
					{ label: '维修中', count: getCount(repairRes), color: '#d97706', bgColor: '#fffbeb', icon: 'undo', status: 3 },
					{ label: '待处理报修', count: getCount(pendingRepairRes), color: '#dc2626', bgColor: '#fef2f2', icon: 'paperplane', status: 'pending-repair' },
					{ label: '待保养', count: getCount(pendingMaintRes), color: '#0891b2', bgColor: '#ecfeff', icon: 'calendar', status: 'pending-maintenance' }
				]
			} catch (e) {
				console.error('loadStats error:', e)
				throw e
			}
		},
		async loadRecentAlerts() {
			try {
				const res = await db.collection('medical-device-alert')
					.where('is_read == 0')
					.orderBy('alert_date', 'desc')
					.limit(5)
					.get()
				this.recentAlerts = res.data || res.result?.data || []
			} catch (e) {
				console.error('loadRecentAlerts error:', e)
				throw e
			}
		},
		async markAlertRead(item) {
			if (item.is_read) return
			try {
				await db.collection('medical-device-alert').doc(item._id).update({
					is_read: 1,
					read_date: Date.now()
				})
				item.is_read = 1
			} catch (e) {
				console.error('markAlertRead error:', e)
			}
		},
		navigateToStat(item) {
			const routes = {
				'pending-repair': '/pages/repair-request/list',
				'pending-maintenance': '/pages/alert/list'
			}
			const route = routes[item.status]
			if (route) {
				uni.navigateTo({ url: route })
			} else {
				uni.switchTab({ url: '/pages/device/device-list' })
			}
		},
		execAction(name) {
			const map = {
				toScan: () => uni.navigateTo({ url: '/pages/device/scan' }),
				toDeviceList: () => uni.switchTab({ url: '/pages/device/device-list' }),
				toAddRepair: () => uni.navigateTo({ url: '/pages/repair-request/add' }),
				toRepairs: () => uni.navigateTo({ url: '/pages/repair-request/list' }),
				toAlerts: () => uni.navigateTo({ url: '/pages/alert/list' }),
				toRepairHistory: () => uni.navigateTo({ url: '/pages/repair-request/list' }),
				toScanHistory: () => uni.navigateTo({ url: '/pages/device/scan' }),
				toProfile: () => uni.switchTab({ url: '/pages/ucenter/ucenter' })
			}
			;(map[name] || (() => {}))()
		},
		toUserOrLogin() {
			if (this.hasLogin) {
				uni.switchTab({ url: '/pages/ucenter/ucenter' })
			} else {
				uni.navigateTo({ url: '/uni_modules/uni-id-pages/pages/login/login-withpwd' })
			}
		},
		toAlerts() {
			uni.navigateTo({ url: '/pages/alert/list' })
		},
		toAlertDetail(item) {
			this.markAlertRead(item)
			uni.navigateTo({ url: '/pages/alert/list?highlight=' + item._id })
		}
	}
}
</script>

<style lang="scss" scoped>
.warp {
	min-height: 100vh;
	background-color: #f5f5f7;
	padding-bottom: 20rpx;
}
.header {
	padding: 60rpx 30rpx 40rpx;
	background: linear-gradient(135deg, #6366f1, #8b5cf6);
	color: #fff;
	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.header-greeting {
		display: block;
		font-size: 40rpx;
		font-weight: 700;
	}
	.header-subtitle {
		display: block;
		font-size: 24rpx;
		opacity: 0.8;
		margin-top: 10rpx;
		padding-left: 2em;
	}
	.header-user {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.header-avatar {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: rgba(255,255,255,0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.header-icon-font {
		font-family: uniicons;
		font-size: 28rpx;
		color: #fff;
	}
	.header-username {
		font-size: 20rpx;
		color: rgba(255,255,255,0.9);
		margin-top: 6rpx;
		max-width: 100rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
.stats-grid {
	display: flex;
	flex-wrap: wrap;
	padding: 0 20rpx;
	margin-top: 20rpx;
	gap: 16rpx;
	.stat-card {
		width: calc(50% - 8rpx);
		box-sizing: border-box;
		background: #fff;
		border-radius: 16rpx;
		padding: 28rpx 16rpx;
		margin: 0;
		box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
		display: flex;
		align-items: center;
		gap: 12rpx;
		transition: transform 0.2s;
		&:active { transform: scale(0.97); }
		.stat-icon-box {
			width: 52rpx;
			height: 52rpx;
			border-radius: 12rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
		.stat-icon {
			font-family: uniicons;
			font-size: 28rpx;
			color: #fff;
		}
		.stat-body {
			flex: 1;
			display: flex;
			align-items: baseline;
			gap: 8rpx;
		}
		.stat-number {
			font-size: 34rpx;
			font-weight: 700;
			line-height: 1;
		}
		.stat-label {
			font-size: 22rpx;
			color: #999;
		}
	}
}
.section-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 24rpx 16rpx;
	.section-title-text {
		font-size: 30rpx;
		font-weight: 600;
		color: #333;
	}
	.section-more {
		font-size: 24rpx;
		color: #6366f1;
	}
}
.alert-badge {
	display: inline-block;
	background: #ef4444;
	color: #fff;
	font-size: 20rpx;
	padding: 0 12rpx;
	border-radius: 20rpx;
	margin-left: 8rpx;
	font-weight: 500;
}
.quick-actions {
	background: #fff;
	margin: 20rpx;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 0;
		.action-icon {
			width: 72rpx;
			height: 72rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.action-icon-font {
			font-family: uniicons;
			font-size: 24rpx;
			color: #fff;
		}
		.action-text {
			font-size: 22rpx;
			color: #333;
			margin-top: 10rpx;
		}
	}
}
.alert-section {
	background: #fff;
	margin: 20rpx;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	.alert-list {
		padding: 0 20rpx 10rpx;
	}
	.alert-item {
		display: flex;
		align-items: flex-start;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		&:last-child { border-bottom: none; }
		.alert-dot {
			width: 16rpx;
			height: 16rpx;
			border-radius: 50%;
			margin-right: 16rpx;
			flex-shrink: 0;
			margin-top: 8rpx;
		}
		.dot-unread { background-color: #ef4444; }
		.dot-read { background-color: #d1d5db; }
		.alert-content {
			flex: 1;
			min-width: 0;
			.alert-title {
				font-size: 26rpx;
				color: #333;
				font-weight: 500;
			}
			.alert-desc {
				font-size: 22rpx;
				color: #999;
				margin-top: 4rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}
}
.empty-section {
	padding-bottom: 20rpx;
}
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 30rpx 0;
	.empty-text {
		font-size: 24rpx;
		color: #bbb;
		margin-top: 12rpx;
	}
	.empty-icon-font {
		font-family: uniicons;
		font-size: 40rpx;
		color: #d1d5db;
	}
}
.retry-text {
	color: #6366f1;
	font-weight: 500;
}
</style>
