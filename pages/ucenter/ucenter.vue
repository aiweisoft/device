<template>
	<view class="center">
		<uni-sign-in ref="signIn"></uni-sign-in>
		<view class="userInfo" @click.capture="toUserInfo">
			<view class="user-card">
				<cloud-image width="120rpx" height="120rpx" border-radius="50%" v-if="hasLogin&&userInfo.avatar_file&&userInfo.avatar_file.url" :src="userInfo.avatar_file.url"></cloud-image>
				
				<view v-else class="defaultAvatarUrl">
					<uni-icons type="person-filled" size="44" color="#6366f1"></uni-icons>
				</view>
				
				<view class="logo-title">
					<text class="uer-name" v-if="hasLogin">{{userInfo.nickname||userInfo.username||userInfo.mobile|| $t('mine.unset')}}</text>
					<text class="uer-name" v-else>{{$t('mine.notLogged')}}</text>
				</view>
			</view>
		</view>
		<uni-grid class="grid" :column="4" :showBorder="false" :square="true">
			<uni-grid-item class="item" v-for="(item,index) in gridList" @click.native="tapGrid(index)" :key="index">
				<uni-icons :type="item.icon" size="26" color="#6366f1"></uni-icons>
				<text class="text">{{item.text}}</text>
			</uni-grid-item>
		</uni-grid>
		<uni-list class="center-list" v-for="(sublist , index) in ucenterList" :key="index">
			<uni-list-item v-for="(item,i) in sublist" :title="item.title" link :rightText="item.rightText" :key="i"
				:clickable="true" :to="item.to" @click="ucenterListClick(item)" :show-extra-icon="true"
				:extraIcon="{type:item.icon,color:'#999'}">
				<template v-slot:footer>
					<view v-if="item.showBadge" class="item-footer">
						<text class="item-footer-text">{{item.rightText}}</text>
						<view class="item-footer-badge"></view>
					</view>
				</template>
			</uni-list-item>
		</uni-list>
	</view>
</template>

<script>
	import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';
	import callCheckVersion from '@/uni_modules/uni-upgrade-center-app/utils/call-check-version';
	// #ifdef APP
	import UniShare from '@/uni_modules/uni-share/js_sdk/uni-share.js';
	const uniShare = new UniShare()
	// #endif
	const db = uniCloud.database();
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	export default {
		// #ifdef APP
		onBackPress({from}) {
			if(from=='backbutton'){
				this.$nextTick(function(){
					uniShare.hide()
				})
				return uniShare.isShow;
			}
		},
		// #endif
		data() {
			return {
			gridList: [],
				ucenterList: [
					[{
						"title": "我的报修",
						"to": '/pages/repair-request/list',
						"icon": "paperplane"
					}, {
						"title": "提醒消息",
						"to": '/pages/alert/list',
						"icon": "notification"
					}, {
						"title": "设备列表",
						"to": '',
						"event": "toDeviceList",
						"icon": "list"
					}],
					[{
						"title": this.$t('mine.feedback'),
						"to": '/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback',
						"icon": "help"
					}, {
						"title": this.$t('mine.settings'),
						"to": '/pages/ucenter/settings/settings',
						"icon": "gear"
					}],
					// #ifdef APP
					[{
						"title": this.$t('mine.about'),
						"to": '/pages/ucenter/about/about',
						"icon": "info"
					}]
					// #endif
				],
				listStyles: {
					"height": "150rpx", // 边框高度
					"width": "150rpx", // 边框宽度
					"border": { // 如果为 Boolean 值，可以控制边框显示与否
						"color": "#eee", // 边框颜色
						"width": "1px", // 边框宽度
						"style": "solid", // 边框样式
						"radius": "100%" // 边框圆角，支持百分比
					}
				}
			}
		},
		onLoad() {
			//#ifdef APP-PLUS
			this.ucenterList[this.ucenterList.length - 2].unshift({
				title:this.$t('mine.checkUpdate'),// this.this.$t('mine.checkUpdate')"检查更新"
				rightText: this.appVersion.version + '-' + this.appVersion.versionCode,
				event: 'checkVersion',
				icon: 'loop',
				showBadge: this.appVersion.hasNew
			})
			//#endif
		},
		onShow() {},
		computed: {
			userInfo() {
				return store.userInfo
			},
			hasLogin(){
				return store.hasLogin
			},
			// #ifdef APP-PLUS
			appVersion() {
				return getApp().appVersion
			},
			// #endif
			appConfig() {
				return getApp().globalData.config
			}
		},
		methods: {
			toSettings() {
				uni.navigateTo({
					url: "/pages/ucenter/settings/settings"
				})
			},
			signIn() { //普通签到
				this.$refs.signIn.open()
			},
			signInByAd(){ //看激励视频广告签到
				this.$refs.signIn.showRewardedVideoAd()
			},
			/**
			 * 个人中心项目列表点击事件
			 */
			ucenterListClick(item) {
				if (!item.to && item.event) {
					this[item.event]();
				}
			},
			async checkVersion() {
				let res = await callCheckVersion()
				console.log(res);
				if (res.result.code > 0) {
					checkUpdate()
				} else {
					uni.showToast({
						title: res.result.message,
						icon: 'none'
					});
				}
			},
			toDeviceList() {
				uni.switchTab({ url: '/pages/device/device-list' })
			},
			toUserInfo() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
				})
			},
			tapGrid(index) {
				uni.showToast({
					// title: '你点击了，第' + (index + 1) + '个',
					title: this.$t('mine.clicked') + " " + (index + 1) ,
					icon: 'none'
				});
			},
			/**
			 * 去应用市场评分
			 */
			gotoMarket() {
				// #ifdef APP-PLUS
				const platform = uni.getSystemInfoSync().platform.toLocaleLowerCase();
				if (platform === "ios") {
					// 这里填写appstore应用id
					let appstoreid = this.appConfig.marketId.ios; // 'id1417078253';
					console.log({appstoreid});
					plus.runtime.openURL("itms-apps://" + 'itunes.apple.com/cn/app/wechat/' + appstoreid + '?mt=8',err=>{
						console.log('plus.runtime.openURL err:' + JSON.stringify(err));
					});
				}
				if (platform === "android" || platform === "harmonyos") {
					var Uri = plus.android.importClass("android.net.Uri");
					var uri = Uri.parse("market://details?id=" + this.appConfig.marketId.android);
					var Intent = plus.android.importClass('android.content.Intent');
					var intent = new Intent(Intent.ACTION_VIEW, uri);
					var main = plus.android.runtimeMainActivity();
					main.startActivity(intent);
				}
				// #endif
			},
			/**
			 * 获取积分信息
			 */
			getScore() {
				if (!this.userInfo) return uni.showToast({
					title: this.$t('mine.checkScore'),
					icon: 'none'
				});
				uni.showLoading({
					mask: true
				})
				db.collection("uni-id-scores")
					.where('"user_id" == $env.uid')
					.field('score,balance')
					.orderBy("create_date", "desc")
					.limit(1)
					.get()
					.then((res) => {
						console.log(res);
						const data = res.result.data[0];
						let msg = '';
						msg = data ? (this.$t('mine.currentScore')+ data.balance) : this.$t('mine.noScore');
						uni.showToast({
							title: msg,
							icon: 'none'
						});
					}).finally(()=>{
						uni.hideLoading()
					})
			},
			async share() {
				let {result} = await db.collection('uni-id-users').where("'_id' == $cloudEnv_uid").field('my_invite_code').get()
				let myInviteCode = result.data[0].my_invite_code
				if(!myInviteCode){
					return uni.showToast({
						title: '请检查uni-config-center中uni-id配置，是否已启用 autoSetInviteCode',
						icon: 'none'
					});
				}
				console.log({myInviteCode});
				let {
					appName,
					logo,
					company,
					slogan
				} = this.appConfig.about
				// #ifdef APP
				uniShare.show({
					content: { //公共的分享类型（type）、链接（herf）、标题（title）、summary（描述）、imageUrl（缩略图）
						type: 0,
						href: this.appConfig.h5.url +
							`/#/pages/ucenter/invite/invite?code=uniInvitationCode:${myInviteCode}`,
						title: appName,
						summary: slogan,
						imageUrl: logo +
							'?x-oss-process=image/resize,m_fill,h_100,w_100' //压缩图片解决，在ios端分享图过大导致的图片失效问题
					},
					menus: [{
							"img": "/static/app/sharemenu/wechatfriend.png",
							"text": this.$t('common.wechatFriends'),
							"share": {
								"provider": "weixin",
								"scene": "WXSceneSession"
							}
						},
						{
							"img": "/static/app/sharemenu/wechatmoments.png",
							"text": this.$t('common.wechatBbs'),
							"share": {
								"provider": "weixin",
								"scene": "WXSceneTimeline"
							}
						},
						{
							"img": "/static/app/sharemenu/weibo.png",
							"text": this.$t('common.weibo'),
							"share": {
								"provider": "sinaweibo"
							}
						},
						{
							"img": "/static/app/sharemenu/qq.png",
							"text": "QQ",
							"share": {
								"provider": "qq"
							}
						},
						{
							"img": "/static/app/sharemenu/copyurl.png",
							"text": this.$t('common.copy'),
							"share": "copyurl"
						},
						{
							"img": "/static/app/sharemenu/more.png",
							"text": this.$t('common.more'),
							"share": "shareSystem"
						}
					],
					cancelText: this.$t('common.cancelShare'),
				}, e => { //callback
					console.log(e);
				})
				// #endif
			}
		}
	}
</script>

<style lang="scss" scoped>
	/* #ifndef APP-NVUE */
	page { background-color: #f5f5f7; }
	/* #endif*/

	.center {
		flex: 1;
		flex-direction: column;
		background-color: #f5f5f7;
	}

	.userInfo {
		display: flex;
		padding: 60rpx 30rpx 0;
		flex-direction: column;
		align-items: center;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
	}
	.user-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #fff;
		border-radius: 24rpx;
		padding: 50rpx 80rpx 40rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
		width: 100%;
		max-width: 500rpx;
		margin-bottom: -30rpx;
		position: relative;
		z-index: 1;
	}
	.defaultAvatarUrl {
		display: flex;
		width: 120rpx;
		height: 120rpx;
		background: #f0efff;
		border-radius: 50%;
		justify-content: center;
		align-items: center;
		border: 4rpx solid #e0e7ff;
	}
	.logo-title {
		margin-top: 20rpx;
		align-items: center;
	}
	.uer-name {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}
	.grid-icon-font {
		font-family: uniicons;
		font-size: 26rpx;
		color: #6366f1;
	}
	.center-list {
		margin: 80rpx 20rpx 20rpx;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	}
	/* #ifndef APP-NVUE */
	.center-list ::v-deep .uni-list--border:after {
		-webkit-transform: scaleY(0.5);
		transform: scaleY(0.5);
		margin-left: 80rpx;
	}
	.center-list ::v-deep .uni-list--border-top,
	.center-list ::v-deep .uni-list--border-bottom {
		display: none;
	}
	/* #endif */
	.item-footer {
		flex-direction: row;
		align-items: center;
	}
	.item-footer-text {
		color: #999;
		font-size: 24rpx;
		padding-right: 10rpx;
	}
	.item-footer-badge {
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background-color: #ef4444;
	}
</style>
