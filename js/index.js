const MAX_IMAGE_UPLOAD = 10;

let articleStatus = "-list";
let hashtagNameList = [];
let imageFileDict = {};
let imageFileDictKey = 0;

// 오른쪽 상단 프로필 사진&드롭다운 동적 생성
function showNavbarProfileImage(userId) {
    $.ajax({
        type: "GET",
        url: `${WEB_SERVER_DOMAIN}/profile/navbar-image/${userId}`,
        data : {},
        success : function (response) {
            let tempHtml = `<div class="nav-item nav-link" >
                                <img id="nav-user-profile-image" class="for-cursor" src="" alt="profile image" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                  <div class="dropdown-menu">
                                    <a class="dropdown-item" href="profile.html?userId=${userId}">프로필</a>
                                    <div class="dropdown-divider"></div>
                                    <a class="dropdown-item for-cursor" onclick="logout()">로그아웃</a>
                                  </div>
                            </div>`
            $('#nav-user-profile-button').append(tempHtml)

            if (response) {
                $("#nav-user-profile-image").attr("src", response);
            } else {
                $("#nav-user-profile-image").attr("src", "/images/profile_placeholder.png");
            }
        },
        error: function (request) {
            if (request.status === 401) {
                let tempHtml = `<button type="button" class="btn btn-outline-primary" onClick="location.href='login.html'">로그인</button>`
                $('#nav-user-profile-button').append(tempHtml)
            } else {
                alert(`에러가 발생했습니다.\nError Code: ${request.status}\nError Text : ${request.responseText}`)
            }
        }
    })
}

// 로그아웃 (로그인 페이지로 이동)
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    location.reload();
}

function registerEventListener() {
    // 해시태그 입력 리스너
    $("#hashtag-input").keydown(function (e) {
        // 엔터키 입력 체크
        if (e.keyCode == 13) {
            let hashtag = $('#hashtag-input').val();
            if (hashtag == '' || hashtag == '#') {
                return;
            }

            if (!hashtag.charAt(0) != '#') {
                hashtag = '#' + hashtag;
            }

            if (hashtagNameList.includes(hashtag)) {
                alert("이미 입력한 해시태그입니다.");
                $('#hashtag-input').val('');
                return;
            }

            hashtagNameList.push(hashtag);

            let tmpSpan = `<span class="hashtag" 
                                 style="background-color: ${createRandomColor()}" 
                                 onclick="removeHashtag(this, '${hashtag}')">${hashtag}</span>`;
            $('#hashtag-list').append(tmpSpan);

            $('#hashtag-input').val('');
        }
    });

    // 이미지 파일 입력 리스너
    $('#article-images').on('change', function (e) {
        let files = e.target.files;
        let filesArr = Array.prototype.slice.call(files);

        // 업로드 될 파일 총 개수 검사
        let totalFileCnt = Object.keys(imageFileDict).length + filesArr.length
        if (totalFileCnt > MAX_IMAGE_UPLOAD) {
            alert("이미지는 최대 " + MAX_IMAGE_UPLOAD + "개까지 업로드 가능합니다.");
            return;
        }

        filesArr.forEach(function (file) {
            if (!file.type.match("image.*")) {
                alert("이미지 파일만 업로드 가능합니다.");
                return;
            }

            // FIXME: <div> slider
            let reader = new FileReader();
            reader.onload = function (e) {
                imageFileDict[imageFileDictKey] = file;

                let tmpHtml = `<div class="article-image-container" id="image-${imageFileDictKey}">
                                <img src="${e.target.result}" data-file=${file.name} 
                                         class="article-image"/>
                                <div class="article-image-container-middle" onclick="removeImage(${imageFileDictKey++})">
                                    <div class="text">삭제</div>
                                </div>
                           </div>`
                $('#image-list').append(tmpHtml);
            };
            reader.readAsDataURL(file);
        });
    });
}

function modalEventListener() {
    // 모달 꺼졌을 때 상태 확인 리스너
    $('#article-modal').on('hide.bs.modal', function (e) {
        articleStatus = "-list";
        window.location.reload();
    })

    $('#article-modal').on('show.bs.modal', function (e) {
        articleStatus = "-modal";
    })
}

function articleModalToggle(action) {
    switch (action) {
        // 게시글 추가
        case "add":
            $('#article-text-div').hide();
            $('#article-like-count').hide();
            $('#article-comment-input-div').hide();
            $('#add-article-btn').show();
            $('#article-image-form').show();
            $('#article-location-input-div').show();
            $('#article-hashtag-input-div').show();
            $('#article-textarea').show();
            $('#user-gps-setting').show();
            $('#article-location-list-div').show();
            $('#pagination').show();


            // 이전에 입력되었던 내용 삭제
            hashtagNameList = [];
            imageFileDict = {};
            imageFileDictKey = 0;
            $('#article-images').val('');

            $('#article-username').text(localStorage.getItem("username"));
            // TODO: 사용자 프로필 이미지 사진 설정 (#user-profile-img)
            break;
        // 게시글 상세보기
        case "get":
            $('#add-article-btn').hide();
            $('#article-textarea').hide();
            $('#article-image-form').hide();
            $('#article-location-input-div').hide();
            $('#article-hashtag-input-div').hide();
            $('#user-gps-setting').hide();
            $('#article-location-list-div').hide();
            $('#pagination').hide();
            $('#article-text-div').show();
            $('#article-like-count').show();
            $('#article-comment-input-div').show();

            break;
    }
    $('#article-modal').modal('show');
    $('.modal-dynamic-contents').empty();
}

function createRandomColor() {
    return "hsl(" + 360 * Math.random() + ',' +
        (25 + 70 * Math.random()) + '%,' +
        (85 + 10 * Math.random()) + '%)'
}

function removeHashtag(span, rmHashtag) {
    for (let i = 0; i < hashtagNameList.length; i++) {
        if (hashtagNameList[i] == rmHashtag) {
            hashtagNameList.splice(i, 1);
            break;
        }
    }
    span.remove();
}

function removeImage(key) {
    delete imageFileDict[key];
    $(`#image-${key}`).remove();
}

function addArticle() {
    let formData = new FormData();
    let locationJsonString = JSON.stringify(gLocationInfo)
    formData.append("text", $('#article-textarea').val());
    formData.append("location", locationJsonString);
    formData.append("hashtagNameList", hashtagNameList);

    Object.keys(imageFileDict).forEach(function (key) {
        formData.append("imageFileList", imageFileDict[key]);
    });

    $.ajax({
        type: 'POST',
        url: `${WEB_SERVER_DOMAIN}/articles`,
        enctype: 'multipart/form-data',
        cache: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function (response) {
            // TODO: 서버로부터 결과값 받기
            alert("게시물이 성공적으로 등록됐습니다.");

            $('#article-modal').modal('hide');
            showArticles();
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

/* 모든 게시물 조회 */
function showArticles() {
    $.ajax({
        type: 'GET',
        url: `${WEB_SERVER_DOMAIN}/articles`,
        success: function (response) {
            makeArticles(response);
            deleteSelectLocation();
        },
        error: function (request) {
            alert(`에러가 발생했습니다.\nError Code: ${request.status}\nError Text : ${request.responseText}`)
        }
    })
}

function makeArticles(articles) {
    console.log(articles)
    $('#article-list').empty();
    articles.forEach(function (article) {
        let tmpHtml = ` <div class="col-3">
                            <div class="card" style="display: inline-block;">
                                <img onclick="getArticle(${article.article.id})" class="card-img-top" src="${article.article.imageList[0].url}" alt="Card image cap" width="100px">
                                <div id="card-body" class="card-body">`

        if (article.likes) {
            tmpHtml += `<span id="like-icon${articleStatus}-${article.article.id}" onclick="toggleLike(${article.article.id})"><i class="fas fa-heart" style="color: red"></i> ${num2str(article.likeCount)}</span>
                                    <p class="card-title">사용자 프로필 이미지 / 사용자 이름 /댓글 수</p>
                                    <p class="card-text"><small class="text-muted">Last updated 3 mins ago</small></p>
                                </div>
                            </div>
                        </div>`;
        } else {
            tmpHtml += `<span id="like-icon${articleStatus}-${article.article.id}" onclick="toggleLike(${article.article.id})"><i class="far fa-heart" style="color: red"></i> ${num2str(article.likeCount)}</span>
                                    <p class="card-title">사용자 프로필 이미지 / 사용자 이름 /댓글 수</p>
                                    <p class="card-text"><small class="text-muted">Last updated 3 mins ago</small></p>
                                </div>
                            </div>
                        </div>`;
        }

        $('#article-list').append(tmpHtml);
    })
}

function toggleLike(articleId) {
    if ($(`#like-icon${articleStatus}-${articleId}`).find("i").hasClass("far")) {
        $(`#like-icon${articleStatus}-${articleId}`).find("i").addClass("fas");
        $(`#like-icon${articleStatus}-${articleId}`).find("i").removeClass("far");
        addLike(articleId)
    } else {
        $(`#like-icon${articleStatus}-${articleId}`).find("i").addClass("far");
        $(`#like-icon${articleStatus}-${articleId}`).find("i").removeClass("fas");
        deleteLike(articleId)
    }
}

function addLike(articleId) {
    $.ajax({
        type: "PUT",
        url: `${WEB_SERVER_DOMAIN}/articles/like?articleId=${articleId}`,
        success: function (response) {
            if (articleStatus == "-list") {
                showArticles()
            } else if (articleStatus == "-modal") {
                getArticle(articleId);
            }
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

function deleteLike(articleId) {
    $.ajax({
        type: "PUT",
        url: `${WEB_SERVER_DOMAIN}/articles/unlike?articleId=${articleId}`,
        success: function (response) {
            if (articleStatus == "-list") {
                showArticles()
            } else if (articleStatus == "-modal") {
                getArticle(articleId);
            }
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

/* 특정 게시물 조회: 상세보기 */
function getArticle(id) {
    $.ajax({
        type: 'GET',
        url: `${WEB_SERVER_DOMAIN}/articles/${id}`,
        success: function (response) {
            console.log(response)
            makeArticleContents(response);
            showArticleComments(id)
        },
        fail: function (err) {
            alert("fail");
        }
    })
}

function makeArticleContents(article) {
    articleModalToggle("get");

    $('#article-username').text(article.article.user.username);
    $('#article-text-div').text(article.article.text);

    <!-- 위치 정보 표시 -->
    $('#article-location-div').empty();
    let tmpHtml = ``
    if (article.article.location.placeName == "집") {
        tmpHtml = `<a>${article.article.location.placeName}</a>`
    } else {
        tmpHtml = `<a target='_blank' href="https://map.kakao.com/link/map/${article.article.location.placeName},
                ${article.article.location.ycoordinate},${article.article.location.xcoordinate}">${article.article.location.placeName}</a>`
    }
    $('#article-location-div').append(tmpHtml);

    $('#image-list').empty();
    article.article.imageList.forEach(function (image) {
        let tmpHtml = `<div class="article-image-container" id="image-${image.id}">
                            <img src="${image.url}" class="article-image"/>
                       </div>`
        $('#image-list').append(tmpHtml);
    })

    $('#hashtag-list').empty();
    article.article.hashtagList.forEach(function (hashtag) {
        let tmpSpan = `<span class="hashtag" style="background-color: ${createRandomColor()}">${hashtag.tag}</span>`;
        $('#hashtag-list').append(tmpSpan)
    });

    <!-- 좋아요 표시 -->
    $('#article-like-count').empty();
    if (article.likes) {
        let tempHtml = `<span id="like-icon${articleStatus}-${article.article.id}" onclick="toggleLike(${article.article.id})"><i class="fas fa-heart" style="color: red"></i> 좋아요 : ${num2str(article.likeCount)}</span>`
        $('#article-like-count').append(tempHtml);
    } else {
        let tempHtml = `<span id="like-icon${articleStatus}-${article.article.id}" onclick="toggleLike(${article.article.id})"><i class="far fa-heart" style="color: red"></i> 좋아요 : ${num2str(article.likeCount)}</span>`
        $('#article-like-count').append(tempHtml);
    }

    // 댓글 버튼
    let tempHtml = `<button class="btn btn-outline-secondary" id="article-comment-post-button" type="button" name="${article.article.id}" onclick="postComment(${article.article.id})">게시하기</button>`
    $('#article-comment-input-button-div').append(tempHtml);

}

// 좋아요 수 편집 (K로 나타내기)
function num2str(likesCount) {
    if (likesCount > 10000) {
        return parseInt(likesCount / 1000) + "k"
    }
    if (likesCount > 500) {
        return parseInt(likesCount / 100) / 10 + "k"
    }
    if (likesCount == 0) {
        return ""
    }
    return likesCount
}

// 게시물 상세보기 - 댓글
function showArticleComments(articleId) {
    $.ajax({
        type : "GET",
        url : `${WEB_SERVER_DOMAIN}/comment/${articleId}`,
        success : function(response) {
            for (let i = 0; i < response.length; i++){
                let imgSrc = response[i].userProfileImageUrl ? response[i].userProfileImageUrl : "/images/profile_placeholder.png";
                let tempHtml = `<div class="comment-box" id="comment-box-${response[i].commentId}">
                                    <div class="comment">
                                        <img class="comment-user-profile-image for-cursor" src="${imgSrc}" onclick="location.href='profile.html?userId=${response[i].userId}'">
                                        <a class="comment-username">${response[i].username}</a>
                                        <a class="comment-text">${response[i].commentText}</a>
                                    </div>`

                if (gUserId === `${response[i].userId}`) {
                    tempHtml += `<a onclick="deleteComment(${response[i].commentId})" aria-hidden="true" class="for-cursor x">&times;</a>`
                }
                tempHtml += `</div>`
                $('#article-comment-div').append(tempHtml)
            }
        },
        error: function (request) {
            alert(`에러가 발생했습니다.\nError Code: ${request.status}\nError Text : ${request.responseText}`)
        }
    })
}

// 댓글 입력
function postComment(articleId) {
    let token = localStorage.getItem('token');
    let commentText = $('#article-comment-input-box').val();

    if (!token) {
        return alert("로그인이 필요합니다.")
    } else if (!commentText) {
        alert("댓글 내용을 입력해주세요.")
    } else {
        $.ajax({
            type : "POST",
            url : `${WEB_SERVER_DOMAIN}/comment/${articleId}`,
            contentType: "application/json",
            data: JSON.stringify({
                commentText : commentText
            }),
            success : function () {
                $('#article-comment-div').empty();
                showArticleComments(articleId);
                $('#article-comment-input-box').val('');
                console.log("posting comment success")
            }
        })
    }
}

// 댓글 삭제
function deleteComment(commentId) {
    if (confirm("댓글을 삭제하시겠습니까?")) {
        $.ajax({
            type: "DELETE",
            url : `${WEB_SERVER_DOMAIN}/comment/${commentId}`,
            success : function () {
                $(`#comment-box-${commentId}`).remove();
            }
        })
    }

}