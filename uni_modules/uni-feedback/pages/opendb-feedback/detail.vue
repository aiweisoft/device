<template>
	<view class="container">
		<unicloud-db ref="udb" v-slot:default="{data, loading, error, options}" :options="options"
			collection="opendb-feedback" field="content,imgs,contact,mobile,create_date"
			:where="queryWhere" :getone="true" :manual="true">
			<view v-if="error" class="error">{{error.message}}</view>
			<view v-else-if="loading">
				<uni-load-more status="loading"></uni-load-more>
			</view>
			<view v-else-if="data">
				<view class="detail-card">
					<view class="card-title">反馈内容</view>
					<text class="card-content">{{data.content}}</text>
				</view>

				<view class="detail-card" v-if="data.imgs && data.imgs.length > 0">
					<view class="card-title">图片（{{data.imgs.length}}张）</view>
					<view class="image-grid">
						<view class="image-item" v-for="(file, j) in data.imgs" :key="j">
							<cloud-image v-if="file.url" :src="file.url" width="100%"
								height="180rpx" borderRadius="8rpx" mode="aspectFill"
								@click="previewImage(data.imgs, j)"></cloud-image>
						</view>
					</view>
				</view>

				<view class="detail-card">
					<view class="info-row">
						<text class="info-label">提交时间</text>
						<text class="info-value">{{formatDate(data.create_date)}}</text>
					</view>
					<view class="info-row" v-if="data.contact">
						<text class="info-label">联系人</text>
						<text class="info-value">{{data.contact}}</text>
					</view>
					<view class="info-row" v-if="data.mobile">
						<text class="info-label">联系电话</text>
						<text class="info-value">{{data.mobile}}</text>
					</view>
				</view>
			</view>
		</unicloud-db>

		<view class="bottom-bar">
			<button type="primary" class="btn-edit" @click="handleUpdate">编辑</button>
			<button type="warn" class="btn-delete" @click="handleDelete">删除</button>
		</view>
	</view>
</template>

<script>
	import {
		enumConverter
	} from '../../js_sdk/validator/opendb-feedback.js';

	const db = uniCloud.database();

	export default {
		data() {
			return {
				queryWhere: '',
				options: {
					...enumConverter
				}
			}
		},
		onLoad(e) {
			this._id = e.id
		},
		onReady() {
			if (this._id) {
				this.queryWhere = '_id=="' + this._id + '"'
			}
		},
		methods: {
			handleUpdate() {
				uni.navigateTo({
					url: './edit?id=' + this._id,
					events: {
						refreshData: () => {
							this.$refs.udb.loadData({
								clear: true
							})
						}
					}
				})
			},
			handleDelete() {
				uni.showModal({
					title: '提示',
					content: '确定删除这条反馈吗？',
					success: (res) => {
						if (res.confirm) {
							db.collection('opendb-feedback').doc(this._id).remove()
								.then(() => {
									uni.showToast({
										title: '删除成功',
										icon: 'none'
									})
									setTimeout(() => uni.navigateBack(), 500)
								})
								.catch((err) => {
									uni.showModal({
										content: err.message || '删除失败，请稍后重试',
										showCancel: false
									})
								})
						}
					}
				})
			},
			previewImage(imgs, index) {
				const urls = imgs.map(f => f.url)
				uni.previewImage({
					urls: urls,
					current: index
				})
			},
			formatDate(ts) {
				if (!ts) return ''
				const d = new Date(ts)
				const pad = n => n.toString().padStart(2, '0')
				return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
					pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
			}
		}
	}
</script>

<style>
	.container {
		padding: 12px 12px 80px;
	}

	.detail-card {
		background: #fff;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.card-title {
		font-size: 13px;
		font-weight: 600;
		color: #6366f1;
		margin-bottom: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid #f0f0f0;
	}

	.card-content {
		font-size: 15px;
		color: #333;
		line-height: 1.8;
		white-space: pre-wrap;
	}

	.image-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.image-item {
		width: calc(33.33% - 6px);
	}

	.info-row {
		display: flex;
		padding: 8px 0;
		border-bottom: 1px solid #f5f5f5;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-size: 13px;
		color: #999;
		width: 80px;
		flex-shrink: 0;
	}

	.info-value {
		font-size: 14px;
		color: #333;
		flex: 1;
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		padding: 10px 12px;
		padding-bottom: calc(10px + env(safe-area-inset-bottom));
		background: #fff;
		border-top: 1px solid #f0f0f0;
		gap: 12px;
	}

	.bottom-bar button {
		flex: 1;
		font-size: 14px;
		height: 44px;
		line-height: 44px;
		border-radius: 8px;
	}

	.btn-delete {
		background: #fee2e2;
		color: #ef4444;
	}

	.error {
		padding: 20px;
		color: #ef4444;
		font-size: 14px;
		text-align: center;
	}
</style>
