<template>
	<view class="page" v-if="!loading">
		<view class="info-card">
			<view class="section-title">基本信息</view>
			<view class="info-row"><text class="label">设备名称</text><text class="value">{{ detail.device_name || '-' }}</text></view>
			<view class="info-row"><text class="label">报修人</text><text class="value">{{ detail.requester || '-' }}</text></view>
			<view class="info-row"><text class="label">联系电话</text><text class="value">{{ detail.phone || '-' }}</text></view>
			<view class="info-row"><text class="label">报修日期</text><text class="value">{{ formatDate(detail.request_date) }}</text></view>
			<view class="info-row"><text class="label">紧急程度</text><text class="value">
				<uni-tag :text="urgencyMap[detail.urgency]?.text || '-'" :type="urgencyMap[detail.urgency]?.type || 'default'" size="small" />
			</text></view>
		</view>

		<view class="info-card">
			<view class="section-title">故障信息</view>
			<view class="info-row-column"><text class="label">故障描述</text><text class="value">{{ detail.fault_description || '-' }}</text></view>
			<view class="info-row" v-if="detail.remark"><text class="label">备注</text><text class="value">{{ detail.remark }}</text></view>
		</view>

		<view class="info-card" v-if="detail.status > 1">
			<view class="section-title">处理信息</view>
			<view class="info-row"><text class="label">处理状态</text><text class="value">
				<uni-tag :text="statusMap[detail.status]?.text || '-'" :type="statusMap[detail.status]?.type || 'default'" size="small" />
			</text></view>
			<view class="info-row"><text class="label">处理人</text><text class="value">{{ detail.handler || '-' }}</text></view>
			<view class="info-row"><text class="label">处理时间</text><text class="value">{{ formatDate(detail.handle_date) }}</text></view>
			<view class="info-row-column" v-if="detail.handle_result"><text class="label">处理结果</text><text class="value">{{ detail.handle_result }}</text></view>
		</view>

		<view class="bottom-actions">
			<button v-if="!isMaintainer" class="btn-primary" @click="toEdit">编辑</button>
			<button v-if="canRecordRepair" class="btn-success" @click="toRecordRepair">记录维修</button>
			<button v-if="detail.repair_id" class="btn-outline" @click="toViewRepair">查看维修</button>
			<button v-if="!detail.repair_id" class="btn-danger" @click="confirmDelete">删除</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
import { store } from '@/uni_modules/uni-id-pages/common/store.js';

const statusMap = {
	1: { text: '待处理', type: 'warning' },
	2: { text: '处理中', type: 'primary' },
	3: { text: '已完成', type: 'success' },
	4: { text: '已关闭', type: 'info' }
};
const urgencyMap = {
	1: { text: '一般', type: 'info' },
	2: { text: '紧急', type: 'warning' },
	3: { text: '非常紧急', type: 'error' }
};

export default {
	data() {
		return {
			detail: {},
			loading: true,
			statusMap,
			urgencyMap
		};
	},
	computed: {
		canRecordRepair() {
			return this.detail.status === 1 || this.detail.status === 2;
		},
		isMaintainer() {
			return store.hasLogin && store.userInfo.role?.includes('app_maintainer');
		}
	},
	onLoad(e) {
		if (e.id) this.loadDetail(e.id);
	},
	methods: {
		async loadDetail(id) {
			try {
				const res = await db.collection('medical-device-repair-request').doc(id).get();
				const data = res.result.data[0];
				if (!data) {
					uni.showToast({ title: '报修单不存在', icon: 'none' });
					setTimeout(() => uni.navigateBack(), 1500);
					return;
				}
				this.detail = data;
				if (data.device_id) {
					db.collection('medical-device').doc(data.device_id).field('name').get().then(r => {
						this.detail.device_name = r.result.data[0]?.name || '-';
					});
				}
				const repairRes = await db.collection('medical-device-repair').where({
					repair_request_id: id,
					deleted: 0
				}).field('_id').get();
				if (repairRes.result.data.length) {
					this.detail.repair_id = repairRes.result.data[0]._id;
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},
		formatDate(ts) {
			if (!ts) return '-';
			return new Date(ts).toLocaleDateString('zh-CN');
		},
		toEdit() {
			uni.navigateTo({ url: '/pages/repair-request/add?mode=edit&id=' + this.detail._id });
		},
		toRecordRepair() {
			uni.navigateTo({
				url: '/pages/repair-request/repair-add?mode=add&request_id=' + this.detail._id
					+ '&device_id=' + this.detail.device_id
					+ '&device_name=' + encodeURIComponent(this.detail.device_name || '')
					+ '&fault_description=' + encodeURIComponent(this.detail.fault_description || '')
			});
		},
		toViewRepair() {
			uni.navigateTo({ url: '/pages/repair-request/repair-detail?id=' + this.detail.repair_id });
		},
		async confirmDelete() {
			uni.showModal({
				title: '确认删除',
				content: '确定删除该报修单吗？',
				success: async (res) => {
					if (!res.confirm) return;
					try {
						const checkRes = await db.collection('medical-device-repair').where({
							repair_request_id: this.detail._id,
							deleted: 0
						}).field('_id').get();
						if (checkRes.result.data.length) {
							uni.showModal({
								title: '无法删除',
								content: '该报修单存在关联维修记录，请先删除维修记录。',
								showCancel: false
							});
							return;
						}
						await db.collection('medical-device-repair-request').doc(this.detail._id).update({
							deleted: 1,
							updated_at: Date.now()
						});
						if (this.detail.device_id) {
							await db.collection('medical-device').doc(this.detail.device_id).update({
								status: 2,
								updated_at: Date.now()
							});
						}
						uni.showToast({ title: '删除成功', icon: 'success' });
						uni.$emit('repair-refresh');
						setTimeout(() => uni.navigateBack(), 500);
					} catch (e) {
						console.error(e);
						uni.showToast({ title: e.message || '操作失败', icon: 'none' });
					}
				}
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; padding: 20rpx 20rpx 140rpx; }
.info-card { background: #fff; border-radius: 16rpx; padding: 24rpx 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 26rpx; color: #6366f1; font-weight: 600; margin-bottom: 16rpx; padding-bottom: 12rpx; border-bottom: 1rpx solid #f0f0f0; }
.info-row { display: flex; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f8f8f8; &:last-child { border-bottom: none; } }
.info-row-column { padding: 16rpx 0; border-bottom: 1rpx solid #f8f8f8; &:last-child { border-bottom: none; } .label { display: block; margin-bottom: 8rpx; } .value { display: block; } }
.label { width: 160rpx; font-size: 24rpx; color: #94a3b8; flex-shrink: 0; }
.value { flex: 1; font-size: 26rpx; color: #1e293b; word-break: break-all; }
.bottom-actions { position: fixed; bottom: 0; left: 0; right: 0; display: flex; gap: 16rpx; padding: 24rpx 30rpx; padding-bottom: calc(24rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -2rpx 16rpx rgba(0,0,0,0.06); }
.btn-primary { flex: 1; background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 22rpx 0; font-size: 28rpx; }
.btn-success { flex: 1; background: #10b981; color: #fff; border: none; border-radius: 12rpx; padding: 22rpx 0; font-size: 28rpx; }
.btn-outline { flex: 1; background: #fff; color: #6366f1; border: 2rpx solid #6366f1; border-radius: 12rpx; padding: 22rpx 0; font-size: 28rpx; }
.btn-danger { flex: 1; background: #fff; color: #ef4444; border: 2rpx solid #ef4444; border-radius: 12rpx; padding: 22rpx 0; font-size: 28rpx; }
</style>
