<template>
	<view class="warp">
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

		<view class="stats-grid">
			<view class="stat-card" v-for="(item, i) in stats" :key="i" @click="navigateToStat(item)">
				<view class="stat-icon-box" :style="{backgroundColor: item.bgColor}">
					<text class="stat-icon" :style="{color: item.color}">{{ icons[item.label] }}</text>
				</view>
				<view class="stat-body">
					<text class="stat-number" :style="{color: item.color}">{{ item.count }}</text>
					<text class="stat-label">{{ item.label }}</text>
				</view>
			</view>
		</view>

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

		<view class="alert-section" v-if="recentAlerts.length">
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

		<view class="alert-section empty-section" v-else>
			<view class="section-title">
				<text class="section-title-text">待处理提醒</text>
			</view>
			<view class="empty-state">
				<text class="empty-icon-font">&#xe62c;</text>
				<text class="empty-text">暂无待处理提醒</text>
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
			stats: [
				{ label: '设备总数', count: 0, color: '#4f46e5', bgColor: '#eef2ff', icon: 'list', status: '' },
				{ label: '使用中', count: 0, color: '#059669', bgColor: '#ecfdf5', icon: 'checkmarkempty', status: 2 },
				{ label: '维修中', count: 0, color: '#d97706', bgColor: '#fffbeb', icon: 'undo', status: 3 },
				{ label: '待处理报修', count: 0, color: '#dc2626', bgColor: '#fef2f2', icon: 'paperplane', status: 'pending-repair' }
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
				'待处理报修': '\ue672'
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
		this.loadStats()
		this.loadRecentAlerts()
	},
	methods: {
		async loadStats() {
			try {
				const [totalRes, normalRes, repairRes, pendingRepairRes] = await Promise.all([
					db.collection('medical-device').where('deleted == 0').count(),
					db.collection('medical-device').where('deleted == 0 && status == 2').count(),
					db.collection('medical-device').where('deleted == 0 && status == 3').count(),
					db.collection('medical-device-repair-request').where('status == 0').count()
				])
				const getCount = (res) => res?.total ?? res?.result?.total ?? 0
				this.stats = [
					{ label: '设备总数', count: getCount(totalRes), color: '#4f46e5', bgColor: '#eef2ff', icon: 'list', status: '' },
					{ label: '使用中', count: getCount(normalRes), color: '#059669', bgColor: '#ecfdf5', icon: 'checkmarkempty', status: 2 },
					{ label: '维修中', count: getCount(repairRes), color: '#d97706', bgColor: '#fffbeb', icon: 'undo', status: 3 },
					{ label: '待处理报修', count: getCount(pendingRepairRes), color: '#dc2626', bgColor: '#fef2f2', icon: 'paperplane', status: 'pending-repair' }
				]
			} catch (e) {
				console.error('loadStats error:', e)
			}
		},
		async loadRecentAlerts() {
			try {
				const res = await db.collection('medical-device-alert').where('is_read == 0').orderBy('alert_date', 'desc').limit(5).get()
				this.recentAlerts = res.data || res.result?.data || []
			} catch (e) {
				console.error('loadRecentAlerts error:', e)
			}
		},
		navigateToStat(item) {
			if (item.status === 'pending-repair') {
				uni.navigateTo({ url: '/pages/repair-request/list' })
			} else if (item.status) {
				uni.navigateTo({ url: '/pages/device/device-list?status=' + item.status })
			} else {
				uni.navigateTo({ url: '/pages/device/device-list' })
			}
		},
		execAction(name) {
			const map = {
				toScan: () => uni.navigateTo({ url: '/pages/device/scan' }),
				toDeviceList: () => uni.navigateTo({ url: '/pages/device/device-list' }),
				toAddRepair: () => uni.navigateTo({ url: '/pages/repair-request/add' }),
				toRepairs: () => uni.navigateTo({ url: '/pages/repair-request/list' }),
				toAlerts: () => uni.navigateTo({ url: '/pages/alert/list' }),
				toRepairHistory: () => uni.navigateTo({ url: '/pages/device/device-list?tab=repair' }),
				toScanHistory: () => uni.showToast({ title: '暂无扫码记录', icon: 'none' }),
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
		toAlerts() { uni.navigateTo({ url: '/pages/alert/list' }) },
		toAlertDetail(item) {
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
	margin: 0 20rpx;
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
</style>
