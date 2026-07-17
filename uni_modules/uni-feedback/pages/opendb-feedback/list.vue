<template>
	<view class="container">
		<unicloud-db ref="udb" v-slot:default="{data, pagination, loading, hasMore, error}"
			collection="opendb-feedback" field="content,imgs,contact,mobile,create_date"
			orderby="create_date desc">
			<view v-if="error" class="error">{{error.message}}</view>
			<view v-else-if="data && data.length > 0">
				<view class="feedback-card" v-for="(item, index) in data" :key="index"
					@click="handleItemClick(item._id)">
					<view class="card-header">
						<text class="card-date">{{formatDate(item.create_date)}}</text>
						<view class="card-imgs" v-if="item.imgs && item.imgs.length > 0">
							<text class="img-count">{{item.imgs.length}}张图片</text>
						</view>
					</view>
					<view class="card-body">
						<text class="card-content">{{item.content}}</text>
					</view>
					<view class="card-footer">
						<text class="card-contact" v-if="item.contact">{{item.contact}}</text>
						<text class="card-mobile" v-if="item.mobile">{{item.mobile}}</text>
					</view>
				</view>
			</view>
			<view v-else-if="data && data.length === 0" class="empty">
				<text class="empty-text">暂无反馈记录</text>
			</view>
			<uni-load-more :status="loading ? 'loading' : (hasMore ? 'more' : 'noMore')"></uni-load-more>
		</unicloud-db>
		<uni-fab ref="fab" horizontal="right" vertical="bottom" :pop-menu="false" @fabClick="fabClick" />
	</view>
</template>

<script>
	export default {
		data() {
			return {}
		},
		onPullDownRefresh() {
			this.$refs.udb.loadData({
				clear: true
			}, () => {
				uni.stopPullDownRefresh()
			})
		},
		onReachBottom() {
			this.$refs.udb.loadMore()
		},
		methods: {
			handleItemClick(id) {
				uni.navigateTo({
					url: './detail?id=' + id
				})
			},
			fabClick() {
				uni.navigateTo({
					url: './opendb-feedback',
					events: {
						refreshData: () => {
							this.$refs.udb.loadData({
								clear: true
							})
						}
					}
				})
			},
			formatDate(ts) {
				if (!ts) return ''
				const d = new Date(ts)
				const pad = n => n.toString().padStart(2, '0')
				return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
					pad(d.getHours()) + ':' + pad(d.getMinutes())
			}
		}
	}
</script>

<style>
	.container {
		padding: 12px;
	}

	.feedback-card {
		background: #fff;
		border-radius: 12px;
		padding: 14px 16px;
		margin-bottom: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.card-date {
		font-size: 12px;
		color: #999;
	}

	.img-count {
		font-size: 11px;
		color: #6366f1;
		background: #f0efff;
		padding: 2px 8px;
		border-radius: 10px;
	}

	.card-body {
		margin-bottom: 6px;
	}

	.card-content {
		font-size: 14px;
		color: #333;
		line-height: 1.6;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-footer {
		display: flex;
		gap: 12px;
	}

	.card-contact,
	.card-mobile {
		font-size: 12px;
		color: #999;
	}

	.empty {
		display: flex;
		justify-content: center;
		align-items: center;
		padding-top: 120px;
	}

	.empty-text {
		font-size: 14px;
		color: #ccc;
	}

	.error {
		padding: 20px;
		color: #ef4444;
		font-size: 14px;
		text-align: center;
	}
</style>
