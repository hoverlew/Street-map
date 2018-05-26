
var map;
var markers = [];
var viewModel;
var infowindow;

/***
 * 生成地区详细信息panel
 */
function createMarker(place, infowindow) {
    var address_list = place.formatted_address.split(' ');
    var content = '<div>' + place.name + '</br>地址： '+ address_list[0] +'</br>邮政编码： '+ address_list[2] +'</br>评论： ';
    content += place.reviews 
    ? '<a href="' + place.url + '" target="_blank">==> 查看评论</a></br>评分： ' + place.rating + '</div>'
    : '目前暂无评论</div>';
    infowindow.setContent(content);
};

/***
 * 点击获取展示地域详细信息
 * @param marker
 * @param infowindow
 */
function getPlacesDetails(marker) {
    infowindow.setContent('');
    markers = markers.map(function (item) {
        if(item === marker){
            if(marker.getAnimation() !== null){
                infowindow.close(map, marker);
                item.setAnimation(null);
            }else{
                item.setAnimation(google.maps.Animation.BOUNCE);
            }
        }else{
            infowindow.close(map, marker);
            item.setAnimation(null);
        }
        return item;
    });

    infowindow.marker = marker;
    infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
    });
    // 获取地点的placeId
    var request = {
        location: map.getCenter(),
        radius: '50',
        query: marker.title
    };
    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, getPlaceId);
    function getPlaceId(data, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            var place_id = data[0].place_id;
            function getLocationDetails(place, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    createMarker(place, infowindow);
                }else{
                    infowindow.setContent('<div>' + marker.title + '</div>');
                }
            }
            // 通过placeId 获取地点详细信息
            var tmpRequest = {
                placeId: place_id
            };
            service.getDetails(tmpRequest, getLocationDetails);
        } else {
            infowindow.setContent('<div>' + marker.title + '</div>');
        }
    }
    infowindow.open(map, marker);
};

/***
 * 清除标记信息
 */
function removeMark() {
    markers.map(function (marker) {
        marker.setMap(null);
    });
    markers = [];
};

/***
 * 设置标记信息
 */
function setMark() {
    infowindow = new google.maps.InfoWindow();
    for (var i = 0; i < viewModel.filterLocation().length; i++) {

        var position = viewModel.filterLocation()[i].location;
        var title = viewModel.filterLocation()[i].title;
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });
        markers.push(marker);

        marker.addListener('click', function() {
            getPlacesDetails(this);
        });
    }
};

/***
 * google api回调函数
 */
function initMap() {
    viewModel = new AppViewModel();
    ko.applyBindings(viewModel);

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 22.544982, lng: 113.939198},
        zoom: 15,
        styles: styles
    });
    removeMark();
    setMark();
};

/***
 * knockout
 * @constructor
 */
function AppViewModel() {
    var self = this;

    self.filterLocation = ko.observableArray(locations);
    self.filter = ko.observable("");
    self.toggle = ko.observable("关闭");
    self.toggle_class = ko.observable(false);
    self.toggle_sidebar = function (data, event) {
        if(event.target.title === "关闭"){
            // 关闭sidebar
            self.toggle_class(true);
            self.toggle("开启");
        }else if (event.target.title === "开启"){
            // 开启sidebar
            self.toggle_class(false);
            self.toggle("关闭");
        }
        return true;
    };
    self.getLocations = function () {
        var len = locations.length;
        var filter = [];
        if(self.filter() === ""){
            self.filterLocation(locations);
        }else{
            for (var i=0; i<len; i++){
                if(locations[i].title.indexOf(self.filter()) >= 0){
                    filter.push(locations[i])
                }
            }
            self.filterLocation(filter);
        }

        removeMark();
        setMark();
    };
    self.keyGetLocations = function (data, event) {
        if(event.keyCode === 13) {
            self.getLocations();
        }
        return true;
    };
    self.clickLocationInfo = function (data, event) {
        var tempMarker = markers.filter(function (marker) {
            if(marker.title === data.title){
                return marker;
            }
        });
        if(tempMarker.length > 0){
            getPlacesDetails(tempMarker[0]);
        }
        return true;
    }
};

/*
 * Loading error prompt information
 */
function mapErrorHandler() {
	var oMap= document.querySelector("#map");
    oMap.innerHTML += "<div class='errorMessage'>谷歌地图加载慢如蜗牛。请稍后重新加载此页。</div>";
};