<template>
	<view class="page">
		<uni-segmented-control :current="tabIndex" :values="tabs" @clickItem="switchTab" style-type="text" active-color="#6366f1" />
		<unicloud-db ref="udb" :collection="collectionName" :where="where" :key="'tab-' + tabIndex" page-data="replace" :orderby="orderby"
			:getcount="true" :page-size="15"
			v-slot:default="{data, pagination, hasMore, loading, error}" @load="onqueryload">
			<view class="list-wrap">
				<view class="card-row" v-for="(item, i) in tableData" :key="i">
					<view class="card-content" @click="toDetail(item)">
						<view class="item-top">
							<text class="item-device">{{ item.device_name || '未知设备' }}</text>
							<view class="item-top-right">
								<uni-tag v-if="tabIndex === 0" :text="item.status_text || '未知'" :type="item.status_type || 'default'" size="small" />
								<uni-tag v-if="tabIndex === 1" :text="item.result_text || '未知'" :type="item.result_type || 'default'" size="small" />
							</view>
						</view>
						<text class="item-desc">{{ item.fault_description }}</text>
						<view class="item-meta">
							<text class="item-date">{{ item.date_text || '' }}</text>
							<text class="item-urgency" v-if="tabIndex === 0 && item.urgency_text">紧急: {{ item.urgency_text }}</text>
							<text class="item-cost" v-if="tabIndex === 1 && item.cost != null">费用: ¥{{ item.cost }}</text>
						</view>
					</view>
					<view class="card-actions">
						<template v-if="tabIndex === 0">
							<view v-if="item.status === 1" class="action-btn action-go-repair" @click.stop="toRecordRepair(item)">
								<uni-icons type="compose" size="20" color="#f59e0b"></uni-icons>
								<text>去维修</text>
							</view>
							<view v-if="item.status === 2" class="action-btn action-repair" @click.stop="toRecordRepair(item)">
								<uni-icons type="compose" size="20" color="#10b981"></uni-icons>
								<text>记录维修</text>
							</view>
						</template>
						<template v-if="tabIndex === 1">
							<view class="action-btn action-edit" @click.stop="toEdit(item)">
								<uni-icons type="compose" size="20" color="#6366f1"></uni-icons>
								<text>编辑</text>
							</view>
							<view class="action-btn action-delete" @click.stop="deleteRepair(item)">
								<uni-icons type="trash" size="20" color="#ef4444"></uni-icons>
								<text>删除</text>
							</view>
						</template>
					</view>
				</view>
			</view>
			<uni-load-state :state="{data: tableData, pagination, hasMore, loading, error}" @loadMore="loadMore" />
		</unicloud-db>
	</view>
</template>

<script>
const db = uniCloud.database();
const dbCmd = db.command;
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
const resultMap = {
	1: { text: '已修复', type: 'success' },
	2: { text: '部分修复', type: 'warning' },
	3: { text: '无法修复', type: 'error' }
};

export default {
	data() {
		return {
			tabs: ['我的报修', '维修记录'],
			tabIndex: 0,
			orderby: 'request_date desc',
			where: { deleted: 0 },
			deviceId: '',
			myRequestIds: [],
			tableData: []
		};
	},
	computed: {
		collectionName() {
			return this.tabIndex === 0 ? 'medical-device-repair-request' : 'medical-device-repair';
		},
		uid() {
			return store.userInfo?._id || '';
		}
	},
	onLoad(e) {
		this.deviceId = e.device_id || '';
		const targetTab = e.tab != null ? Number(e.tab) || 0 : 0;
		this.loadMyRequestIds().then(() => {
			this.buildWhere(targetTab);
			if (targetTab !== this.tabIndex) this.tabIndex = targetTab;
		});
		uni.$on('repair-refresh', () => {
			this.loadData(true);
		});
	},
	computed: {
		collectionName() {
			return this.tabIndex === 0 ? 'medical-device-repair-request' : 'medical-device-repair';
		},
		uid() {
			return store.userInfo?._id || '';
		}
	},
	onLoad(e) {
		this.deviceId = e.device_id || '';
		const targetTab = e.tab != null ? Number(e.tab) || 0 : 0;
		const load = this.isMaintainer ? Promise.resolve() : this.loadMyRequestIds();
		load.then(() => {
			this.buildWhere(targetTab);
			if (targetTab !== this.tabIndex) this.tabIndex = targetTab;
		});
		uni.$on('repair-refresh', () => {
			this.loadData(true);
		});
	},
	onUnload() {
		uni.$off('repair-refresh');
	},
	methods: {
		async loadMyRequestIds() {
			try {
				const uid = this.uid;
				if (!uid) { this.myRequestIds = []; return; }
				const res = await db.collection('medical-device-repair-request')
					.where({ deleted: 0, creator: uid })
					.field('_id').get();
				this.myRequestIds = (res.result.data || []).map(i => i._id);
			} catch (e) {
				console.error(e);
				this.myRequestIds = [];
			}
		},
		buildWhere(tab) {
			const uid = this.uid;
			if (tab === 0) {
				const w = { deleted: 0 };
				if (uid) w.creator = uid;
				if (this.deviceId) w.device_id = this.deviceId;
				this.orderby = 'request_date desc';
				this.where = w;
			} else {
				const ids = this.myRequestIds;
				this.orderby = 'repair_date desc';
				if (ids.length) {
					const w = { deleted: 0, repair_request_id: dbCmd.in(ids) };
					if (this.deviceId) w.device_id = this.deviceId;
					this.where = w;
				} else {
					this.where = { deleted: 0, _id: '__nonexistent__' };
				}
			}
		},
		switchTab(e) {
			const idx = e.currentIndex;
			this.buildWhere(idx);
			this.tabIndex = idx;
		},
		loadData(clear = true) {
			this.$refs.udb && this.$refs.udb.loadData({ clear });
		},
		loadMore() { this.$refs.udb?.loadMore(); },
		toDetail(item) {
			if (this.tabIndex === 0) {
				uni.navigateTo({ url: '/pages/repair-request/detail?id=' + item._id });
			} else {
				uni.navigateTo({ url: '/pages/repair-request/repair-detail?id=' + item._id });
			}
		},
		toRecordRepair(item) {
			uni.navigateTo({
				url: '/pages/repair-request/repair-add?mode=add&request_id=' + item._id
					+ '&device_id=' + item.device_id
					+ '&device_name=' + encodeURIComponent(item.device_name || '')
					+ '&fault_description=' + encodeURIComponent(item.fault_description || '')
			});
		},
		toEdit(item) {
			if (this.tabIndex === 0) {
				uni.navigateTo({ url: '/pages/repair-request/add?mode=edit&id=' + item._id });
			} else {
				uni.navigateTo({ url: '/pages/repair-request/repair-add?mode=edit&id=' + item._id });
			}
		},
		async deleteRepairRequest(item) {
			try {
				const checkRes = await db.collection('medical-device-repair').where({
					repair_request_id: item._id,
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
			} catch (e) { return; }
			uni.showModal({
				title: '确认删除',
				content: '确定删除该报修单吗？',
				success: async (res) => {
					if (!res.confirm) return;
					try {
						await db.collection('medical-device-repair-request').doc(item._id).update({
							deleted: 1,
							updated_at: Date.now()
						});
						if (item.device_id) {
							await db.collection('medical-device').doc(item.device_id).update({
								status: 2,
								updated_at: Date.now()
							});
						}
						uni.showToast({ title: '删除成功', icon: 'success' });
						this.loadData(true);
					} catch (e) {
						uni.showToast({ title: e.message || '操作失败', icon: 'none' });
					}
				}
			});
		},
		deleteRepair(item) {
			uni.showModal({
				title: '确认删除',
				content: '确定删除该维修记录吗？删除后报修单将恢复为待处理状态。',
				success: async (res) => {
					if (!res.confirm) return;
					try {
						await db.collection('medical-device-repair').doc(item._id).update({
							deleted: 1,
							updated_at: Date.now()
						});
						if (item.repair_request_id) {
							await db.collection('medical-device-repair-request').doc(item.repair_request_id).update({
								status: 1,
								updated_at: Date.now()
							});
						}
						if (item.device_id) {
							await db.collection('medical-device').doc(item.device_id).update({
								status: 3,
								updated_at: Date.now()
							});
						}
						uni.showToast({ title: '删除成功', icon: 'success' });
						this.loadData(true);
					} catch (e) {
						uni.showToast({ title: e.message || '操作失败', icon: 'none' });
					}
				}
			});
		},
		async onqueryload(data) {
			console.log('onqueryload called, data length:', data ? data.length : 0, 'tabIndex:', this.tabIndex);
			const deviceIds = [...new Set(data.map(i => i.device_id).filter(Boolean))];
			const deviceMap = {};
			if (deviceIds.length) {
				const deviceRes = await db.collection('medical-device').where({ _id: dbCmd.in(deviceIds) }).field('_id,name').get();
				(deviceRes.result.data || []).forEach(d => { deviceMap[d._id] = d.name; });
			}
			this.tableData = data.map(item => {
				const ext = { device_name: deviceMap[item.device_id] || '未知' };
				if (this.tabIndex === 0) {
					const s = statusMap[item.status];
					ext.status_text = s?.text || '未知';
					ext.status_type = s?.type || 'default';
					const u = urgencyMap[item.urgency];
					ext.urgency_text = u?.text || '';
					ext.date_text = item.request_date ? new Date(item.request_date).toLocaleDateString('zh-CN') : '';
				} else {
					const r = resultMap[item.result];
					ext.result_text = r?.text || '未知';
					ext.result_type = r?.type || 'default';
					ext.date_text = item.repair_date ? new Date(item.repair_date).toLocaleDateString('zh-CN') : '';
				}
				return { ...item, ...ext };
			});
		}
	}
};
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; }
.uni-segmented-control { background: #fff; padding: 12rpx 0; }
.list-wrap { padding: 0 20rpx; }
.card-row { background: #fff; border-radius: 16rpx; margin-bottom: 20rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.card-content { padding: 24rpx 30rpx 16rpx; cursor: pointer; }
.item-top { display: flex; justify-content: space-between; align-items: center; }
.item-top-right { display: flex; align-items: center; gap: 12rpx; }
.item-device { font-size: 28rpx; font-weight: 600; color: #1e293b; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-desc { font-size: 24rpx; color: #666; display: block; margin-top: 10rpx; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.item-meta { display: flex; gap: 20rpx; margin-top: 12rpx; }
.item-date, .item-urgency, .item-cost { font-size: 22rpx; color: #94a3b8; }
.card-actions { display: flex; border-top: 1rpx solid #f5f5f7; }
.action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx; padding: 18rpx 0; font-size: 24rpx; cursor: pointer; &:active { opacity: 0.7; } }
.action-repair { color: #10b981; }
.action-go-repair { color: #f59e0b; }
.action-edit { color: #6366f1; }
.action-delete { color: #ef4444; }
.loading-hint { text-align: center; padding: 60rpx 0; color: #999; font-size: 26rpx; }
</style>
