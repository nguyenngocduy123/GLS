(window.webpackJsonp=window.webpackJsonp||[]).push([[14],{q8ba:function(l,n,e){"use strict";e.r(n);var a=e("CcnG"),u=function(){},t=e("Qm6G"),i=e("NcP4"),o=e("t68o"),r=e("xYTU"),s=e("zbXB"),b=e("CQVA"),c=e("pMnS"),d=e("fiJ/"),m=e("k10Q"),f=e("0G9l"),h=e("7jv/"),p=e("JsB9"),g=e("44rI"),v=e("MXbC"),_=e("O7jx"),X=e("0/Q6"),y=e("Mr+X"),k=e("SMsm"),M=e("TtEo"),W=e("LC5p"),x=e("Ip0R"),w=e("6UMx"),C=e("Wf4p"),D=e("lzlj"),U=e("FVSy"),T=e("bujt"),j=e("UodH"),I=e("dWZg"),O=e("lLAP"),L=e("wFw1"),B=e("g/GL"),R=e("iLfO"),A=e("ZYCi"),S=e("Euyf"),N=e("SJHx"),P=e("Cmri"),z=e("v9Dh"),q=e("eDkP"),E=e("qAlS"),G=e("Fzqc"),V=e("qfoL"),Y=e("bo59"),$=e("gIcY"),F=e("mVsa"),J=e("2Q+G"),H=e("GW0G"),Q=e("4v8u"),K=e("yHON"),Z=e("cPJV"),ll=e("/Tkk"),nl=e("cmJY"),el=e("BCsM"),al=e("D8hx"),ul=e("bri6"),tl=function(){function l(l,n,e,a){this._plannerData=l,this._messageRest=n,this._dialog=e,this._toast=a,this._subscriptions=[],this.sidebarTitle="0 new",this.messages=[],this.filteredMessages=[],this.selectedIndex=0,this.groupBy="date",this._dataTableService=new H.h,this._plannerData.addListeners(["Message"])}return l.prototype.ngOnInit=function(){var l=this,n=this._plannerData.Message;this.jobQuery={startDate:Q(new Date,7),endDate:new Date},this._plannerData.setMessageCachedObject(this.jobQuery,!0),this._subscriptions=[n.data$.subscribe(function(n){console.log("PlannerMessageBoxComponent -> ngOnInit -> Message:get",n),l.messages=n,l.filter(),l._updateVariables()},function(n){return l._dialog.errorResponse(n)}),n.update$.subscribe(function(n){console.log("PlannerMessageBoxComponent -> ngOnInit -> Message:update",n),n.data.forEach(function(n){var e=l.messages.find(function(l){return l.job.Id===n.job.Id});e?Object.assign(e,n):l.messages.push(n)}),l.filter(),console.log("PlannerMessageBoxComponent -> ngOnInit -> this.messages",l.messages),l._updateVariables()})]},l.prototype.ngOnDestroy=function(){this._subscriptions.forEach(function(l){return l.unsubscribe()}),this._plannerData.removeAllListeners()},l.prototype.onDateRangeChange=function(l){this._plannerData.setMessageCachedObject(l,!0)},l.prototype.refresh=function(){var l=this;this._dialog.confirm("REFRESH_CHANGES_CONFIRM_MSG").subscribe(function(n){n&&(l._plannerData.Message.refresh(),l.searchTerm=void 0)})},l.prototype.filter=function(){var l=this,n=this.messages.filter(function(n){return l._plannerData.Message.shouldDataBeUpdated(n)});console.log("PlannerMessageBoxComponent -> filter -> tt",n),this.filteredMessages=nl.a.filterArrayBySearchTerm(this.searchTerm,this.messages,["driverRemarks","fromUsername","job.DeliveryMasterId","job.ContactName","job.Postal"]).sort(function(n,e){return"date"===l.groupBy?K(n.modified_date,e.modified_date):n.fromUsername!==e.fromUsername?n.fromUsername<e.fromUsername?-1:1:K(n.modified_date,e.modified_date)}),this.groupHeaders=this.filteredMessages.map(function(n,e){var a=e>0?l.filteredMessages[e-1]:void 0;return"date"===l.groupBy?0!==e&&ll(n.modified_date,a.modified_date)?void 0:Z(n.modified_date,"MMM DD, YYYY"):0===e||n.fromUsername!==a.fromUsername?n.fromUser.fullname||n.fromUsername:void 0})},l.prototype.openOrderDialog=function(l){this._dialog.openOrderDetailById(l)},l.prototype.processMessage=function(l){var n=this;this._messageRest.process(l).subscribe(function(l){n.filter(),n._toast.shortAlert("Message has been acknowledged")},function(l){return n._dialog.errorResponse(l)})},l.prototype._updateVariables=function(){var l=this;this.selected=this.messages[this.selectedIndex]||this.messages[0];var n=this.messages.filter(function(l){return!l.processedByUsername}).length;this.sidebarTitle=n+" new",this._messageRest.getUnprocessedMessagesCount().subscribe(function(e){return l.sidebarTitle=n+" new, "+(e-n)+" overdue"})},l}(),il=a.Va({encapsulation:0,styles:[[".sidebar-title[_ngcontent-%COMP%]{padding-left:16px}.valign-center[_ngcontent-%COMP%]{vertical-align:middle;align-items:center}"]],data:{}});function ol(l){return a.rb(0,[(l()(),a.Xa(0,0,null,null,2,"h3",[["class","mat-subheader"],["matSubheader",""]],null,null,null,null,null)),a.Wa(1,16384,null,0,X.g,[],null,null),(l()(),a.pb(2,null,["",""]))],null,function(l,n){l(n,2,0,n.component.groupHeaders[n.parent.context.index])})}function rl(l){return a.rb(0,[(l()(),a.Xa(0,0,null,null,2,"mat-icon",[["class","tc-amber-800 mat-icon"],["role","img"]],[[2,"mat-icon-inline",null]],null,null,y.b,y.a)),a.Wa(1,638976,null,0,k.a,[a.l,k.c,[8,null]],null,null),(l()(),a.pb(-1,0,["fiber_new"]))],function(l,n){l(n,1,0)},function(l,n){l(n,0,0,a.hb(n,1).inline)})}function sl(l){return a.rb(0,[(l()(),a.Xa(0,0,null,null,2,"mat-icon",[["class","tc-green-800 mat-icon"],["role","img"]],[[2,"mat-icon-inline",null]],null,null,y.b,y.a)),a.Wa(1,638976,null,0,k.a,[a.l,k.c,[8,null]],null,null),(l()(),a.pb(-1,0,["done_all"]))],function(l,n){l(n,1,0)},function(l,n){l(n,0,0,a.hb(n,1).inline)})}function bl(l){return a.rb(0,[(l()(),a.Xa(0,0,null,null,1,"mat-divider",[["class","mat-divider"],["role","separator"]],[[1,"aria-orientation",0],[2,"mat-divider-vertical",null],[2,"mat-divider-horizontal",null],[2,"mat-divider-inset",null]],null,null,M.b,M.a)),a.Wa(1,49152,null,0,W.a,[],null,null)],null,function(l,n){l(n,0,0,a.hb(n,1).vertical?"vertical":"horizontal",a.hb(n,1).vertical,!a.hb(n,1).vertical,a.hb(n,1).inset)})}function cl(l){return a.rb(0,[(l()(),a.Oa(16777216,null,null,1,null,ol)),a.Wa(1,16384,null,0,x.m,[a.U,a.R],{ngIf:[0,"ngIf"]},null),(l()(),a.Xa(2,0,null,null,18,"mat-list-item",[["class","mat-list-item"]],[[4,"background",null],[2,"mat-list-item-avatar",null],[2,"mat-list-item-with-avatar",null]],[[null,"click"],[null,"focus"],[null,"blur"]],function(l,n,e){var u=!0,t=l.component;return"focus"===n&&(u=!1!==a.hb(l,3)._handleFocus()&&u),"blur"===n&&(u=!1!==a.hb(l,3)._handleBlur()&&u),"click"===n&&(u=!1!==(t.selected=l.context.$implicit)&&u),u},w.d,w.b)),a.Wa(3,1097728,null,3,X.d,[a.l,[2,X.h]],null,null),a.nb(603979776,1,{_lines:1}),a.nb(335544320,2,{_avatar:0}),a.nb(335544320,3,{_icon:0}),(l()(),a.Xa(7,0,null,1,2,"h3",[["class","mat-line"],["matLine",""]],null,null,null,null,null)),a.Wa(8,16384,[[1,4]],0,C.o,[],null,null),(l()(),a.pb(9,null,["Order ",""])),(l()(),a.Xa(10,0,null,1,2,"h3",[["class","mat-line"],["matLine",""]],null,null,null,null,null)),a.Wa(11,16384,[[1,4]],0,C.o,[],null,null),(l()(),a.pb(12,null,["expected to be LATE by ",""])),(l()(),a.Xa(13,0,null,1,3,"p",[["class","mat-line"],["matLine",""]],null,null,null,null,null)),a.Wa(14,16384,[[1,4]],0,C.o,[],null,null),(l()(),a.pb(15,null,[" reported by "," at "," "])),a.lb(16,2),(l()(),a.Oa(16777216,null,2,1,null,rl)),a.Wa(18,16384,null,0,x.m,[a.U,a.R],{ngIf:[0,"ngIf"]},null),(l()(),a.Oa(16777216,null,2,1,null,sl)),a.Wa(20,16384,null,0,x.m,[a.U,a.R],{ngIf:[0,"ngIf"]},null),(l()(),a.Oa(16777216,null,null,1,null,bl)),a.Wa(22,16384,null,0,x.m,[a.U,a.R],{ngIf:[0,"ngIf"]},null),(l()(),a.Oa(0,null,null,0))],function(l,n){l(n,1,0,n.component.groupHeaders[n.context.index]),l(n,18,0,!n.context.$implicit.processedAt),l(n,20,0,n.context.$implicit.processedAt),l(n,22,0,!n.context.last)},function(l,n){l(n,2,0,n.component.selected===n.context.$implicit?"lightgray ":"white",a.hb(n,3)._avatar||a.hb(n,3)._icon,a.hb(n,3)._avatar||a.hb(n,3)._icon),l(n,9,0,n.context.$implicit.job.DeliveryMasterId),l(n,12,0,n.context.$implicit.lateBy),l(n,15,0,(null==n.context.$implicit.fromUser?null:n.context.$implicit.fromUser.fullname)||n.context.$implicit.fromUsername,a.qb(n,15,1,l(n,16,0,a.hb(n.parent,0),n.context.$implicit.modified_date,"shortTime")))})}function dl(l){return a.rb(0,[(l()(),a.Xa(0,0,null,null,69,"mat-card",[["class","mat-card"]],null,null,null,D.d,D.a)),a.Wa(1,49152,null,0,U.a,[],null,null),(l()(),a.Xa(2,0,null,0,10,"mat-card-title",[["class","mat-card-title"]],null,null,null,null,null)),a.Wa(3,16384,null,0,U.f,[],null,null),(l()(),a.Xa(4,0,null,null,8,"div",[["layout","row"]],null,null,null,null,null)),(l()(),a.pb(5,null,[" Order "," "])),(l()(),a.Xa(6,0,null,null,0,"span",[["flex",""]],null,null,null,null,null)),(l()(),a.Xa(7,0,null,null,5,"button",[["mat-button",""]],[[8,"disabled",0],[2,"_mat-animation-noopable",null]],[[null,"click"]],function(l,n,e){var a=!0,u=l.component;return"click"===n&&(a=!1!==u.processMessage(u.selected)&&a),a},T.d,T.b)),a.Wa(8,180224,null,0,j.b,[a.l,I.a,O.h,[2,L.a]],{disabled:[0,"disabled"]},null),(l()(),a.Xa(9,0,null,0,2,"mat-icon",[["class","mat-icon"],["role","img"]],[[2,"mat-icon-inline",null]],null,null,y.b,y.a)),a.Wa(10,638976,null,0,k.a,[a.l,k.c,[8,null]],null,null),(l()(),a.pb(-1,0,["reply"])),(l()(),a.pb(-1,0,[" Acknowledge "])),(l()(),a.Xa(13,0,null,0,1,"mat-divider",[["class","mat-divider"],["role","separator"]],[[1,"aria-orientation",0],[2,"mat-divider-vertical",null],[2,"mat-divider-horizontal",null],[2,"mat-divider-inset",null]],null,null,M.b,M.a)),a.Wa(14,49152,null,0,W.a,[],null,null),(l()(),a.Xa(15,0,null,0,54,"mat-card-content",[["class","mat-card-content"]],null,null,null,null,null)),a.Wa(16,16384,null,0,U.b,[],null,null),(l()(),a.Xa(17,0,null,null,4,"p",[],null,null,null,null,null)),(l()(),a.Xa(18,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Reported At: "])),(l()(),a.pb(20,null,[" "," "])),a.lb(21,2),(l()(),a.Xa(22,0,null,null,4,"p",[],null,null,null,null,null)),(l()(),a.Xa(23,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Last Updated At: "])),(l()(),a.pb(25,null,[" "," "])),a.lb(26,2),(l()(),a.Xa(27,0,null,null,3,"p",[],null,null,null,null,null)),(l()(),a.Xa(28,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Last Updated By: "])),(l()(),a.pb(30,null,[" "," "])),(l()(),a.Xa(31,0,null,null,3,"p",[],null,null,null,null,null)),(l()(),a.Xa(32,0,null,null,2,"b",[],null,null,null,null,null)),(l()(),a.Xa(33,0,null,null,1,"u",[],null,null,null,null,null)),(l()(),a.pb(34,null,["The below order expected to be late by ",""])),(l()(),a.Xa(35,0,null,null,4,"p",[],null,null,null,null,null)),(l()(),a.Xa(36,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Order No: "])),(l()(),a.Xa(38,0,null,null,1,"a",[["href","javascript:;"]],null,[[null,"click"]],function(l,n,e){var a=!0,u=l.component;return"click"===n&&(a=!1!==u.openOrderDialog(u.selected.job.DeliveryMasterId)&&a),a},null,null)),(l()(),a.pb(39,null,[" "," "])),(l()(),a.Xa(40,0,null,null,3,"p",[],null,null,null,null,null)),(l()(),a.Xa(41,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Job Type: "])),(l()(),a.pb(43,null,[" "," "])),(l()(),a.Xa(44,0,null,null,5,"p",[],null,null,null,null,null)),(l()(),a.Xa(45,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Time Slot: "])),(l()(),a.pb(47,null,[" "," - "," "])),a.lb(48,2),a.lb(49,2),(l()(),a.Xa(50,0,null,null,3,"p",[],null,null,null,null,null)),(l()(),a.Xa(51,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Postal Code: "])),(l()(),a.pb(53,null,[" "," "])),(l()(),a.Xa(54,0,null,null,3,"p",[],null,null,null,null,null)),(l()(),a.Xa(55,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Contact Phone: "])),(l()(),a.pb(57,null,[" "," "])),(l()(),a.Xa(58,0,null,null,3,"p",[],null,null,null,null,null)),(l()(),a.Xa(59,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Driver Name: "])),(l()(),a.pb(61,null,[" "," "])),(l()(),a.Xa(62,0,null,null,3,"p",[],null,null,null,null,null)),(l()(),a.Xa(63,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Driver Phone: "])),(l()(),a.pb(65,null,[" "," "])),(l()(),a.Xa(66,0,null,null,3,"p",[],null,null,null,null,null)),(l()(),a.Xa(67,0,null,null,1,"b",[],null,null,null,null,null)),(l()(),a.pb(-1,null,["Driver Remark: "])),(l()(),a.pb(69,null,[" "," "]))],function(l,n){l(n,8,0,n.component.selected.processedByUsername),l(n,10,0)},function(l,n){var e=n.component;l(n,5,0,e.selected.job.DeliveryMasterId),l(n,7,0,a.hb(n,8).disabled||null,"NoopAnimations"===a.hb(n,8)._animationMode),l(n,9,0,a.hb(n,10).inline),l(n,13,0,a.hb(n,14).vertical?"vertical":"horizontal",a.hb(n,14).vertical,!a.hb(n,14).vertical,a.hb(n,14).inset),l(n,20,0,a.qb(n,20,0,l(n,21,0,a.hb(n.parent,0),e.selected.created_date,"medium"))),l(n,25,0,a.qb(n,25,0,l(n,26,0,a.hb(n.parent,0),e.selected.processedAt,"medium"))),l(n,30,0,(null==e.selected.processedBy?null:e.selected.processedBy.fullname)||e.selected.processedByUsername||"N.A."),l(n,34,0,e.selected.lateBy),l(n,39,0,e.selected.job.DeliveryMasterId),l(n,43,0,e.selected.job.JobType),l(n,47,0,a.qb(n,47,0,l(n,48,0,a.hb(n.parent,0),e.selected.job.StartTimeWindow,"shortTime")),a.qb(n,47,1,l(n,49,0,a.hb(n.parent,0),e.selected.job.EndTimeWindow,"shortTime"))),l(n,53,0,e.selected.job.Postal),l(n,57,0,e.selected.job.ContactPhone),l(n,61,0,(null==e.selected.fromUser?null:e.selected.fromUser.fullname)||e.selected.fromUsername),l(n,65,0,null==e.selected.fromUser?null:e.selected.fromUser.phone),l(n,69,0,e.selected.driverRemarks)})}function ml(l){return a.rb(0,[a.jb(0,x.e,[a.x]),(l()(),a.Xa(1,0,null,null,51,"td-layout-nav-list",[["mode","side"],["navigationRoute","/"],["sidenavWidth","320px"],["toolbarTitle"," Message"]],null,null,null,B.g,B.c)),a.Wa(2,49152,[["navList",4]],0,R.g,[[2,A.o]],{toolbarTitle:[0,"toolbarTitle"],mode:[1,"mode"],sidenavWidth:[2,"sidenavWidth"],navigationRoute:[3,"navigationRoute"]},null),(l()(),a.Xa(3,0,null,0,5,"button",[["mat-icon-button",""],["td-menu-button",""],["tdLayoutToggle",""]],[[8,"disabled",0],[2,"_mat-animation-noopable",null]],[[null,"click"]],function(l,n,e){var u=!0;return"click"===n&&(u=!1!==a.hb(l,5).clickListener(e)&&u),u},T.d,T.b)),a.Wa(4,180224,null,0,j.b,[a.l,I.a,O.h,[2,L.a]],null,null),a.Wa(5,4341760,null,0,R.i,[R.c,a.I,a.l],{tdLayoutToggle:[0,"tdLayoutToggle"]},null),(l()(),a.Xa(6,0,null,0,2,"mat-icon",[["class","mat-icon"],["role","img"]],[[2,"mat-icon-inline",null]],null,null,y.b,y.a)),a.Wa(7,638976,null,0,k.a,[a.l,k.c,[8,null]],null,null),(l()(),a.pb(-1,0,["menu"])),(l()(),a.Xa(9,0,null,3,15,"div",[["flex",""],["layout","row"],["layout-align","start center"],["td-toolbar-content",""]],null,null,null,null,null)),(l()(),a.Xa(10,0,null,null,5,"button",[["mat-icon-button",""],["tdLayoutNavListOpen",""]],[[8,"disabled",0],[2,"_mat-animation-noopable",null]],[[null,"click"]],function(l,n,e){var u=!0;return"click"===n&&(u=!1!==a.hb(l,12).clickListener(e)&&u),u},T.d,T.b)),a.Wa(11,180224,null,0,j.b,[a.l,I.a,O.h,[2,L.a]],null,null),a.Wa(12,4341760,null,0,R.h,[R.g,a.I,a.l],{hideWhenOpened:[0,"hideWhenOpened"],tdLayoutNavListOpen:[1,"tdLayoutNavListOpen"]},null),(l()(),a.Xa(13,0,null,0,2,"mat-icon",[["class","mat-icon"],["role","img"]],[[2,"mat-icon-inline",null]],null,null,y.b,y.a)),a.Wa(14,638976,null,0,k.a,[a.l,k.c,[8,null]],null,null),(l()(),a.pb(-1,0,["arrow_back"])),(l()(),a.Xa(16,0,null,null,1,"vrp-planner-date-range-selection",[["class","pad-left"]],null,[[null,"rangeChange"]],function(l,n,e){var a=!0;return"rangeChange"===n&&(a=!1!==l.component.onDateRangeChange(e)&&a),a},S.b,S.a)),a.Wa(17,49152,null,0,N.a,[P.a],{range:[0,"range"]},{rangeChange:"rangeChange"}),(l()(),a.Xa(18,0,null,null,0,"span",[["flex",""]],null,null,null,null,null)),(l()(),a.Xa(19,16777216,null,null,5,"button",[["mat-icon-button",""],["matTooltip","Reload"]],[[8,"disabled",0],[2,"_mat-animation-noopable",null]],[[null,"click"],[null,"longpress"],[null,"keydown"],[null,"touchend"]],function(l,n,e){var u=!0,t=l.component;return"longpress"===n&&(u=!1!==a.hb(l,20).show()&&u),"keydown"===n&&(u=!1!==a.hb(l,20)._handleKeydown(e)&&u),"touchend"===n&&(u=!1!==a.hb(l,20)._handleTouchend()&&u),"click"===n&&(u=!1!==t.refresh()&&u),u},T.d,T.b)),a.Wa(20,147456,null,0,z.d,[q.c,a.l,E.c,a.U,a.C,I.a,O.c,O.h,z.b,[2,G.c],[2,z.a]],{message:[0,"message"]},null),a.Wa(21,180224,null,0,j.b,[a.l,I.a,O.h,[2,L.a]],null,null),(l()(),a.Xa(22,0,null,0,2,"mat-icon",[["class","mat-icon"],["role","img"]],[[2,"mat-icon-inline",null]],null,null,y.b,y.a)),a.Wa(23,638976,null,0,k.a,[a.l,k.c,[8,null]],null,null),(l()(),a.pb(-1,0,["refresh"])),(l()(),a.Xa(25,0,null,2,25,"div",[["td-sidenav-content",""]],null,null,null,null,null)),(l()(),a.Xa(26,0,null,null,12,"div",[["class","valign-center"],["layout","row"]],null,null,null,null,null)),(l()(),a.Xa(27,0,null,null,5,"td-search-box",[["alwaysVisible","true"],["backIcon","arrow_back"],["flex",""]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"searchDebounce"],[null,"ngModelChange"]],function(l,n,e){var a=!0,u=l.component;return"searchDebounce"===n&&(a=!1!==u.filter()&&a),"ngModelChange"===n&&(a=!1!==(u.searchTerm=e)&&a),a},V.b,V.a)),a.Wa(28,49152,[["searchBox",4]],0,Y.b,[a.i],{backIcon:[0,"backIcon"],alwaysVisible:[1,"alwaysVisible"],placeholder:[2,"placeholder"]},{onSearchDebounce:"searchDebounce"}),a.mb(1024,null,$.p,function(l){return[l]},[Y.b]),a.Wa(30,671744,null,0,$.u,[[8,null],[8,null],[8,null],[6,$.p]],{model:[0,"model"]},{update:"ngModelChange"}),a.mb(2048,null,$.q,null,[$.u]),a.Wa(32,16384,null,0,$.r,[[4,$.q]],null,null),(l()(),a.Xa(33,16777216,null,null,5,"button",[["aria-haspopup","true"],["mat-icon-button",""]],[[8,"disabled",0],[2,"_mat-animation-noopable",null],[1,"aria-expanded",0]],[[null,"mousedown"],[null,"keydown"],[null,"click"]],function(l,n,e){var u=!0;return"mousedown"===n&&(u=!1!==a.hb(l,35)._handleMousedown(e)&&u),"keydown"===n&&(u=!1!==a.hb(l,35)._handleKeydown(e)&&u),"click"===n&&(u=!1!==a.hb(l,35)._handleClick(e)&&u),u},T.d,T.b)),a.Wa(34,180224,null,0,j.b,[a.l,I.a,O.h,[2,L.a]],null,null),a.Wa(35,1196032,null,0,F.f,[q.c,a.l,a.U,F.b,[2,F.c],[8,null],[2,G.c],O.h],{menu:[0,"menu"]},null),(l()(),a.Xa(36,0,null,0,2,"mat-icon",[["class","mat-icon"],["role","img"]],[[2,"mat-icon-inline",null]],null,null,y.b,y.a)),a.Wa(37,638976,null,0,k.a,[a.l,k.c,[8,null]],null,null),(l()(),a.pb(-1,0,["reorder"])),(l()(),a.Xa(39,0,null,null,1,"mat-divider",[["class","mat-divider"],["role","separator"]],[[1,"aria-orientation",0],[2,"mat-divider-vertical",null],[2,"mat-divider-horizontal",null],[2,"mat-divider-inset",null]],null,null,M.b,M.a)),a.Wa(40,49152,null,0,W.a,[],null,null),(l()(),a.Xa(41,0,null,null,3,"div",[["layout","row"]],null,null,null,null,null)),(l()(),a.Xa(42,0,null,null,2,"h3",[["class","sidebar-title mat-line"],["matLine",""]],null,null,null,null,null)),a.Wa(43,16384,null,0,C.o,[],null,null),(l()(),a.pb(44,null,["",""])),(l()(),a.Xa(45,0,null,null,1,"mat-divider",[["class","mat-divider"],["role","separator"]],[[1,"aria-orientation",0],[2,"mat-divider-vertical",null],[2,"mat-divider-horizontal",null],[2,"mat-divider-inset",null]],null,null,M.b,M.a)),a.Wa(46,49152,null,0,W.a,[],null,null),(l()(),a.Xa(47,0,null,null,3,"mat-nav-list",[["class","vrp-planner-message-list mat-nav-list"],["role","navigation"]],null,null,null,w.f,w.c)),a.Wa(48,49152,null,0,X.h,[],null,null),(l()(),a.Oa(16777216,null,0,1,null,cl)),a.Wa(50,278528,null,0,x.l,[a.U,a.R,a.v],{ngForOf:[0,"ngForOf"]},null),(l()(),a.Oa(16777216,null,4,1,null,dl)),a.Wa(52,16384,null,0,x.m,[a.U,a.R],{ngIf:[0,"ngIf"]},null),(l()(),a.Xa(53,0,null,null,10,"mat-menu",[],null,null,null,J.d,J.a)),a.Wa(54,1294336,[["groupByMenu",4]],2,F.c,[a.l,a.C,F.a],{overlapTrigger:[0,"overlapTrigger"]},null),a.nb(603979776,4,{items:1}),a.nb(335544320,5,{lazyContent:0}),a.mb(2048,null,F.h,null,[F.c]),(l()(),a.Xa(58,0,null,0,2,"a",[["class","mat-menu-item"],["mat-menu-item",""],["role","menuitem"]],[[2,"mat-menu-item-highlighted",null],[2,"mat-menu-item-submenu-trigger",null],[1,"tabindex",0],[1,"aria-disabled",0],[1,"disabled",0]],[[null,"click"],[null,"mouseenter"]],function(l,n,e){var u=!0,t=l.component;return"click"===n&&(u=!1!==a.hb(l,59)._checkDisabled(e)&&u),"mouseenter"===n&&(u=!1!==a.hb(l,59)._handleMouseEnter()&&u),"click"===n&&(t.groupBy="date",u=!1!==t.filter()&&u),u},J.c,J.b)),a.Wa(59,180224,[[4,4]],0,F.d,[a.l,x.d,O.h,[2,F.h]],null,null),(l()(),a.pb(-1,0,[" Group by Date "])),(l()(),a.Xa(61,0,null,0,2,"a",[["class","mat-menu-item"],["mat-menu-item",""],["role","menuitem"]],[[2,"mat-menu-item-highlighted",null],[2,"mat-menu-item-submenu-trigger",null],[1,"tabindex",0],[1,"aria-disabled",0],[1,"disabled",0]],[[null,"click"],[null,"mouseenter"]],function(l,n,e){var u=!0,t=l.component;return"click"===n&&(u=!1!==a.hb(l,62)._checkDisabled(e)&&u),"mouseenter"===n&&(u=!1!==a.hb(l,62)._handleMouseEnter()&&u),"click"===n&&(t.groupBy="sender",u=!1!==t.filter()&&u),u},J.c,J.b)),a.Wa(62,180224,[[4,4]],0,F.d,[a.l,x.d,O.h,[2,F.h]],null,null),(l()(),a.pb(-1,0,[" Group by Sender "]))],function(l,n){var e=n.component;l(n,2,0," Message","side","320px","/"),l(n,5,0,""),l(n,7,0),l(n,12,0,!0,""),l(n,14,0),l(n,17,0,e.jobQuery),l(n,20,0,"Reload"),l(n,23,0),l(n,28,0,"arrow_back","true","Search here ("+e.filteredMessages.length+" total)"),l(n,30,0,e.searchTerm),l(n,35,0,a.hb(n,54)),l(n,37,0),l(n,50,0,e.filteredMessages),l(n,52,0,e.selected),l(n,54,0,!1)},function(l,n){var e=n.component;l(n,3,0,a.hb(n,4).disabled||null,"NoopAnimations"===a.hb(n,4)._animationMode),l(n,6,0,a.hb(n,7).inline),l(n,10,0,a.hb(n,11).disabled||null,"NoopAnimations"===a.hb(n,11)._animationMode),l(n,13,0,a.hb(n,14).inline),l(n,19,0,a.hb(n,21).disabled||null,"NoopAnimations"===a.hb(n,21)._animationMode),l(n,22,0,a.hb(n,23).inline),l(n,27,0,a.hb(n,32).ngClassUntouched,a.hb(n,32).ngClassTouched,a.hb(n,32).ngClassPristine,a.hb(n,32).ngClassDirty,a.hb(n,32).ngClassValid,a.hb(n,32).ngClassInvalid,a.hb(n,32).ngClassPending),l(n,33,0,a.hb(n,34).disabled||null,"NoopAnimations"===a.hb(n,34)._animationMode,a.hb(n,35).menuOpen||null),l(n,36,0,a.hb(n,37).inline),l(n,39,0,a.hb(n,40).vertical?"vertical":"horizontal",a.hb(n,40).vertical,!a.hb(n,40).vertical,a.hb(n,40).inset),l(n,44,0,e.sidebarTitle),l(n,45,0,a.hb(n,46).vertical?"vertical":"horizontal",a.hb(n,46).vertical,!a.hb(n,46).vertical,a.hb(n,46).inset),l(n,58,0,a.hb(n,59)._highlighted,a.hb(n,59)._triggersSubmenu,a.hb(n,59)._getTabIndex(),a.hb(n,59).disabled.toString(),a.hb(n,59).disabled||null),l(n,61,0,a.hb(n,62)._highlighted,a.hb(n,62)._triggersSubmenu,a.hb(n,62)._getTabIndex(),a.hb(n,62).disabled.toString(),a.hb(n,62).disabled||null)})}var fl=a.Ta("vrp-planner-message-box",tl,function(l){return a.rb(0,[(l()(),a.Xa(0,0,null,null,1,"vrp-planner-message-box",[],null,null,null,ml,il)),a.Wa(1,245760,null,0,tl,[el.a,ul.a,P.a,al.a],null,null)],function(l,n){l(n,1,0)},null)},{},{},[]),hl=e("M2Lx"),pl=e("uGex"),gl=e("4epT"),vl=e("ZYjt"),_l=e("o3x0"),Xl=e("jQLj"),yl=e("wmQ5"),kl=e("4tE/"),Ml=e("+dGY"),Wl=e("r8Is"),xl=e("t/Na"),wl=e("+gH2"),Cl=e("wm4d"),Dl=e("vARd"),Ul=e("A7o+"),Tl=e("SN/6"),jl=e("YXNw"),Il=e("lf6A"),Ol=e("/VYK"),Ll=e("seP3"),Bl=e("b716"),Rl=e("YhbO"),Al=e("4c35"),Sl=e("jlZm"),Nl=e("de3e"),Pl=e("kWGw"),zl=e("Z+uX"),ql=e("Blfk"),El=e("8mMr"),Gl=e("Lwpp"),Vl=e("La40"),Yl=e("Nsh5"),$l=e("r43C"),Fl=e("hjRe"),Jl=e("uK2o"),Hl=e("6q6f"),Ql=e("rxZL"),Kl=e("Ps+U"),Zl=e("GSLX"),ln=e("6w6d"),nn=e("m5n6"),en=e("hIJP"),an=e("zrK0"),un=e("36nB"),tn=e("qkDU"),on=e("x0yz"),rn=e("gUJA"),sn=function(){};e.d(n,"PlannerMessageBoxModuleNgFactory",function(){return bn});var bn=a.Ua(u,[],function(l){return a.eb([a.fb(512,a.k,a.Ha,[[8,[t.c,i.a,o.a,r.a,r.b,s.b,s.a,b.a,c.a,d.a,m.a,f.a,h.a,p.a,g.a,v.a,_.a,fl]],[3,a.k],a.A]),a.fb(4608,x.o,x.n,[a.x,[2,x.C]]),a.fb(4608,$.C,$.C,[]),a.fb(4608,$.f,$.f,[]),a.fb(4608,hl.c,hl.c,[]),a.fb(4608,C.d,C.d,[]),a.fb(4608,q.c,q.c,[q.i,q.e,a.k,q.h,q.f,a.t,a.C,x.d,G.c]),a.fb(5120,q.j,q.k,[q.c]),a.fb(5120,z.b,z.c,[q.c]),a.fb(5120,F.b,F.g,[q.c]),a.fb(5120,pl.a,pl.b,[q.c]),a.fb(5120,gl.b,gl.a,[[3,gl.b]]),a.fb(4608,vl.f,C.e,[[2,C.i],[2,C.n]]),a.fb(5120,_l.c,_l.d,[q.c]),a.fb(4608,_l.e,_l.e,[q.c,a.t,[2,x.i],[2,_l.b],_l.c,[3,_l.e],q.e]),a.fb(4608,C.c,C.A,[[2,C.h],I.a]),a.fb(4608,Xl.i,Xl.i,[]),a.fb(5120,Xl.a,Xl.b,[q.c]),a.fb(4608,yl.f,yl.f,[]),a.fb(5120,kl.b,kl.c,[q.c]),a.fb(5120,Ml.h,Ml.b,[[3,Ml.h],a.k,q.c,a.t]),a.fb(5120,Ml.i,Ml.c,[[3,Ml.i],Ml.h]),a.fb(5120,H.h,H.b,[[3,H.h]]),a.fb(4608,Wl.e,Wl.e,[A.o]),a.fb(4608,Wl.f,Wl.f,[]),a.fb(4608,xl.j,xl.p,[x.d,a.E,xl.n]),a.fb(4608,xl.q,xl.q,[xl.j,xl.o]),a.fb(5120,xl.a,function(l){return[l]},[xl.q]),a.fb(4608,xl.m,xl.m,[]),a.fb(6144,xl.k,null,[xl.m]),a.fb(4608,xl.i,xl.i,[xl.k]),a.fb(6144,xl.b,null,[xl.i]),a.fb(4608,xl.g,xl.l,[xl.b,a.t]),a.fb(4608,xl.c,xl.c,[xl.g]),a.fb(4608,wl.a,wl.a,[xl.c,"MAP_BASE_URL"]),a.fb(4608,Cl.a,Cl.a,[_l.e,Dl.b,Ul.k]),a.fb(1073742336,x.c,x.c,[]),a.fb(1073742336,$.z,$.z,[]),a.fb(1073742336,$.l,$.l,[]),a.fb(1073742336,$.w,$.w,[]),a.fb(1073742336,Ul.h,Ul.h,[]),a.fb(1073742336,Tl.a,Tl.a,[]),a.fb(1073742336,jl.a,jl.a,[]),a.fb(1073742336,Tl.g,Tl.g,[]),a.fb(1073742336,Il.b,Il.b,[]),a.fb(1073742336,Tl.j,Tl.j,[]),a.fb(1073742336,Tl.c,Tl.c,[]),a.fb(1073742336,Tl.f,Tl.f,[]),a.fb(1073742336,I.b,I.b,[]),a.fb(1073742336,Ol.c,Ol.c,[]),a.fb(1073742336,hl.d,hl.d,[]),a.fb(1073742336,Ll.e,Ll.e,[]),a.fb(1073742336,Bl.c,Bl.c,[]),a.fb(1073742336,Rl.c,Rl.c,[]),a.fb(1073742336,Al.g,Al.g,[]),a.fb(1073742336,Sl.b,Sl.b,[]),a.fb(1073742336,G.a,G.a,[]),a.fb(1073742336,C.n,C.n,[[2,C.f]]),a.fb(1073742336,U.d,U.d,[]),a.fb(1073742336,C.p,C.p,[]),a.fb(1073742336,C.z,C.z,[]),a.fb(1073742336,C.x,C.x,[]),a.fb(1073742336,W.b,W.b,[]),a.fb(1073742336,X.e,X.e,[]),a.fb(1073742336,k.b,k.b,[]),a.fb(1073742336,O.a,O.a,[]),a.fb(1073742336,E.b,E.b,[]),a.fb(1073742336,q.g,q.g,[]),a.fb(1073742336,z.e,z.e,[]),a.fb(1073742336,j.c,j.c,[]),a.fb(1073742336,F.e,F.e,[]),a.fb(1073742336,C.u,C.u,[]),a.fb(1073742336,pl.d,pl.d,[]),a.fb(1073742336,gl.c,gl.c,[]),a.fb(1073742336,Nl.c,Nl.c,[]),a.fb(1073742336,Pl.c,Pl.c,[]),a.fb(1073742336,_l.k,_l.k,[]),a.fb(1073742336,zl.c,zl.c,[]),a.fb(1073742336,ql.c,ql.c,[]),a.fb(1073742336,Dl.e,Dl.e,[]),a.fb(1073742336,C.B,C.B,[]),a.fb(1073742336,C.r,C.r,[]),a.fb(1073742336,Xl.j,Xl.j,[]),a.fb(1073742336,El.b,El.b,[]),a.fb(1073742336,Gl.d,Gl.d,[]),a.fb(1073742336,yl.g,yl.g,[]),a.fb(1073742336,Vl.a,Vl.a,[]),a.fb(1073742336,Yl.h,Yl.h,[]),a.fb(1073742336,kl.e,kl.e,[]),a.fb(1073742336,$l.a,$l.a,[]),a.fb(1073742336,Ml.a,Ml.a,[]),a.fb(1073742336,R.a,R.a,[]),a.fb(1073742336,Fl.a,Fl.a,[]),a.fb(1073742336,Jl.a,Jl.a,[]),a.fb(1073742336,Y.a,Y.a,[]),a.fb(1073742336,H.a,H.a,[]),a.fb(1073742336,Wl.a,Wl.a,[]),a.fb(1073742336,Hl.a,Hl.a,[]),a.fb(1073742336,xl.e,xl.e,[]),a.fb(1073742336,xl.d,xl.d,[]),a.fb(1073742336,Ql.a,Ql.a,[]),a.fb(1073742336,Kl.a,Kl.a,[]),a.fb(1073742336,Zl.a,Zl.a,[]),a.fb(1073742336,A.r,A.r,[[2,A.y],[2,A.o]]),a.fb(1073742336,ln.a,ln.a,[]),a.fb(1073742336,nn.a,nn.a,[]),a.fb(1073742336,en.a,en.a,[]),a.fb(1073742336,an.a,an.a,[]),a.fb(1073742336,un.b,un.b,[]),a.fb(1073742336,tn.a,tn.a,[]),a.fb(1073742336,on.a,on.a,[]),a.fb(1073742336,rn.a,rn.a,[]),a.fb(1073742336,sn,sn,[]),a.fb(1073742336,u,u,[]),a.fb(256,C.g,C.k,[]),a.fb(256,xl.n,"XSRF-TOKEN",[]),a.fb(256,xl.o,"X-XSRF-TOKEN",[]),a.fb(1024,A.m,function(){return[[{path:"",component:tl}]]},[])])})}}]);