<template>
	<view class="page" v-if="!loading">
		<view class="info-card">
			<view class="section-title">关联信息</view>
			<view class="info-row"><text class="label">设备名称</text><text class="value">{{ deviceName || '-' }}</text></view>
			<view class="info-row"><text class="label">报修人</text><text class="value">{{ requestInfo.requester || '-' }}</text></view>
			<view class="info-row"><text class="label">报修日期</text><text class="value">{{ formatDate(requestInfo.request_date) }}</text></view>
			<view class="info-row-column"><text class="label">原始故障描述</text><text class="value">{{ requestInfo.fault_description || '-' }}</text></view>
		</view>

		<view class="info-card">
			<view class="section-title">维修信息</view>
			<view class="info-row"><text class="label">维修结果</text><text class="value">
				<uni-tag :text="resultMap[detail.result]?.text || '-'" :type="resultMap[detail.result]?.type || 'default'" size="small" />
			</text></view>
			<view class="info-row"><text class="label">维修日期</text><text class="value">{{ formatDate(detail.repair_date) }}</text></view>
			<view class="info-row-column"><text class="label">故障描述</text><text class="value">{{ detail.fault_description || '-' }}</text></view>
			<view class="info-row"><text class="label">故障原因</text><text class="value">{{ detail.fault_reason || '-' }}</text></view>
			<view class="info-row"><text class="label">维修方式</text><text class="value">{{ detail.repair_method || '-' }}</text></view>
			<view class="info-row"><text class="label">维修人员</text><text class="value">{{ detail.repair_person || '-' }}</text></view>
			<view class="info-row"><text class="label">维修公司</text><text class="value">{{ detail.repair_company || '-' }}</text></view>
			<view class="info-row"><text class="label">维修费用</text><text class="value">{{ detail.cost != null ? '¥' + detail.cost : '-' }}</text></view>
			<view class="info-row" v-if="detail.remark"><text class="label">备注</text><text class="value">{{ detail.remark }}</text></view>
		</view>

		<view class="bottom-actions">
			<button class="btn-primary" @click="toEdit">编辑</button>
			<button class="btn-danger" @click="confirmDelete">删除</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();

const resultMap = {
	1: { text: '已修复', type: 'success' },
	2: { text: '部分修复', type: 'warning' },
	3: { text: '无法修复', type: 'error' }
};

export default {
	data() {
		return {
			detail: {},
			requestInfo: {},
			deviceName: '',
			loading: true,
			resultMap
		};
	},
	onLoad(e) {
		if (e.id) this.loadDetail(e.id);
		uni.$on('repair-refresh', () => {
			this.loadDetail(e.id);
		});
	},
	onUnload() {
		uni.$off('repair-refresh');
	},
	methods: {
		async loadDetail(id) {
			try {
				const res = await db.collection('medical-device-repair').doc(id).get();
				const data = res.result.data[0];
				if (!data) {
					uni.showToast({ title: '维修记录不存在', icon: 'none' });
					setTimeout(() => uni.navigateBack(), 1500);
					return;
				}
				this.detail = data;
				const promises = [];
				if (data.device_id) {
					promises.push(
						db.collection('medical-device').doc(data.device_id).field('name').get().then(r => {
							this.deviceName = r.result.data[0]?.name || '';
						})
					);
				}
				if (data.repair_request_id) {
					promises.push(
						db.collection('medical-device-repair-request').doc(data.repair_request_id)
							.field('requester,request_date,fault_description').get().then(r => {
								this.requestInfo = r.result.data[0] || {};
							})
					);
				}
				await Promise.all(promises);
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
			uni.navigateTo({ url: '/pages/repair-request/repair-add?mode=edit&id=' + this.detail._id });
		},
		confirmDelete() {
			uni.showModal({
				title: '确认删除',
				content: '确定删除该维修记录吗？删除后报修单将恢复为待处理状态。',
				success: async (res) => {
					if (!res.confirm) return;
					try {
						await db.collection('medical-device-repair').doc(this.detail._id).update({
							deleted: 1,
							updated_at: Date.now()
						});
						if (this.detail.repair_request_id) {
							await db.collection('medical-device-repair-request').doc(this.detail.repair_request_id).update({
								status: 1,
								updated_at: Date.now()
							});
						}
						if (this.detail.device_id) {
							await db.collection('medical-device').doc(this.detail.device_id).update({
								status: 3,
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
.btn-danger { flex: 1; background: #fff; color: #ef4444; border: 2rpx solid #ef4444; border-radius: 12rpx; padding: 22rpx 0; font-size: 28rpx; }
</style>
