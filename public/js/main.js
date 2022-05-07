$(document).ready(() => {
    function getDir() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        let dir = urlParams.get('dir');
        return dir;
    }
    function getDir_v2(e) {
        const dir = $(e.target).parents('tr').attr('dir');
        return dir;
    }

    function renderHtml(file) {
        return `<tr id="${file.name}" dir="${file.dir}">
                    <td> ${file.icon} <a href="${file.subPath}">${file.name}</a></td>
                    <td>${file.type}</td>
                    <td>${file.size}</td>
                    <td>${file.lastModified}</td>
                    <td>
                        <span><i class="fa fa-download action download-action"></i></button>
                        <span><i class="fa fa-edit action edit-action"></i></button>
                        <span><i class="fa fa-trash action delete-action"></i></button>
                    </td>
                </tr>`
    }
    function clickAction() {
        $('.delete-action').on('click', e => {
            $('#confirm-delete').modal("show");
            const name = $(e.target).parents('tr').attr('id');
            $('#nameDel').text(name);
            $('#nameDel').attr('dir', getDir_v2(e));
        })
        $('.edit-action').on('click', e => {
            const nameFile = $(e.target).parents('tr').attr('id');
            $('#nameOld').text(nameFile);
            $('#nameOld').attr('dir', getDir_v2(e));

            $('#confirm-rename').modal("show");
        })
    }


    // -------BreadCrumb-------------------------------------------------------
    let dir = getDir();
    $("#dir").text(dir);
    // dir =  $("#dir").text();
    let breadcrumb;
    let html = '';
    let path = '/?dir=';
    if (dir == null) {
        breadcrumb = [];
    } else {
        breadcrumb = dir.split('/');
    }
    breadcrumb.forEach(element => {
        path += `${element}/`;
        html += `<li class="breadcrumb-item" style="cursor: pointer"><a href="${path.slice(0, -1)}">${element}</a></li>`;
    });
    $('.breadcrumb').append(html);
    $('#customFile').change((e) => {
        var name = e.target.files[0].name;
        $('#label-name').text(name);
    })
    //Click
    clickAction();
    // ----------------------Rename File--------------------------------------------------
    $('#btn-rename').click(e => {
        let dir = $('#nameOld').attr('dir');
        const namefileold = $('#nameOld').text();
        const namefilenew = $('#nameFile').val();
        const body = {
            namefilenew,
            namefileold,
            dir
        }
        $.ajax({
            url: '/rename',
            type: 'post',
            data: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': $("input[name='_csrf']").val(),
            },
            success: function (data) {
                if (data.code == 200) {
                    // const nameNewFile = data.newfile.name;
                    // $($(`tr[id="${namefileold}"]`).find('td a')[0]).text(nameNewFile).attr('href', data.newfile.newPath);
                    // $(`tr[id="${namefileold}"]`).attr('id', nameNewFile);

                    const file = data.files[0]
                    $($(`tr[id="${namefileold}"]`).find('td a')[0]).text(file.name).attr('href', file.subPath);
                    $(`tr[id="${namefileold}"]`).attr('id', file.name);
                    $('#nameFile').val('');
                }
                $('#flash-alert').fadeIn();
                $('#messageNoti').text(data.message);
            }
        })
    })

    //-----------------------Upload File---------------------------------------------------------
    if ($('#customFile').val() == '') {
        $('#btn-upload').attr('disabled', '');
    }
    $('#customFile').change(e => {
        $('#btn-upload').removeAttr('disabled');
    })
    $("#form-upload").submit(function (e) {
        e.preventDefault();
        $('#btn-upload').attr('disabled', '');
        let dir = $("#dir").text();
        let data = new FormData(this);
        data.append("path", dir);
        $.ajax({
            url: '/upload',
            type: 'post',
            headers: {
                'CSRF-Token': $("input[name='_csrf']").val(),
            },
            data,
            processData: false,
            contentType: false,
            // ---------------------progress file--------
            xhr: function () {
                const xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', e => {
                        const { loaded, total } = e;
                        progress = (loaded / total) * 100;
                        $('#progress-upload').css('width', progress + '%');
                    },
                        false
                    );
                    return xhr;
                }
            },
            //   --------------------------------
            success: function (data) {
                if (data.code == 200) {
                    const file = data.files[0]
                    let html = renderHtml(file);
                    console.log(file);
                    $('tbody').append(html);
                    clickAction();
                    download();
                }
                $('#flash-alert-upload').fadeIn();
                $('#messageNoti-upload').text(data.message);
                setTimeout(() => {
                    $('#progress-upload').css('width', 0 + '%');
                    $('#btn-upload').removeAttr('disabled');
                }, 1000)
            }
        });
    })

    //----------------------New Folder------------------------------------------------------
    $('#btn-createF').click(e => {
        $('#confirm-new-folder').modal('show');
    })
    $('#btn-new-folder').click(e => {
        const name = $('#nameFolder').val();
        // let dir = getDir();
        let dir = $("#dir").text();
        const body = {
            name,
            dir,
        }
        $.ajax({
            url: '/new-folder',
            type: 'post',
            data: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': $("input[name='_csrf']").val(),
            },
            success: function (data) {
                if (data.code == 200) {
                    const folder = data.folder;
                    let html = renderHtml(folder.data[0]);
                    $('tbody').append(html);
                    clickAction();
                    download();
                }
                $('#flash-alert').fadeIn();
                $('#messageNoti').text(data.message);
            }
        })
    })

    // -----------------------Delete ------------------------------------------------------
    $('#btn-delete').click(e => {
        let dir = $('#nameDel').attr('dir');
        const name = $('#nameDel').text();
        const body = {
            name,
            dir,
        }
        $.ajax({
            url: '/delete',
            type: 'post',
            data: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': $("input[name='_csrf']").val(),
            },
            success: function (data) {
                if (data.code == 200) {
                    $('tbody').find(`tr[id="${data.data.name}"]`).remove();
                }
                $('#flash-alert').fadeIn();
                $('#messageNoti').text(data.message);
            }
        })
    })

    //-----------------------Create File Text -----------------------------------------------
    $('#btn-createFile').click(e => {
        $('#new-file-dialog').modal('show');
    })
    $('#btn-new-file').click(e => {
        // let dir = getDir();
        let dir = $("#dir").text();
        const body = {
            name: $('#new-file-dialog #name').val(),
            content: $('#new-file-dialog #content').val(),
            dir,
        }
        $.ajax({
            url: '/new-file',
            type: 'post',
            data: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': $("input[name='_csrf']").val(),
            },
            success: function (data) {
                if (data.code == 200) {
                    const file = data.files[0]
                    let html = renderHtml(file);
                    $('tbody').append(html);
                    clickAction();
                    download();
                }
                $('#flash-alert').fadeIn();
                $('#messageNoti').text(data.message);
            }
        })
    })

    //-----------------------Dowload---------------------------------------------------------
    function download() {
        $('.download-action').click(e => {
            const name = $(e.target).parents('tr').attr('id');
            let dir = getDir_v2(e);
            const body = {
                name,
                dir,
            }
            $.ajax({
                url: '/download-file',
                type: 'post',
                data: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': $("input[name='_csrf']").val(),
                },
                success: function (data) {
                    if (data.code == 200) {
                        console.log(data.path);
                        window.location.href = "/download/" + encodeURIComponent(data.path);
                    }
                }
            })
        })
    }
    download();

    //----------------------Search-----------------------------------------------------------
    $('#search').on('keyup', function (e) {
        $('tbody').html('');
        let dir = getDir();
        const keySearch = this.value;
        const body = {
            keySearch,
            dir,
        }
        $.ajax({
            url: '/search',
            type: 'post',
            data: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': $("input[name='_csrf']").val(),
            },
            success: function (data) {
                const file = data.file;
                let html = '';
                if (data.code == 200) {
                    if (file) {
                        if (file.length == 0) {
                            $('tbody').append('<p class="text-danger" style="padding:20px 0 0 20px">Thư mục này trống</p>');
                        }
                        $("#dir").text(data.dir);
                        file.forEach(f => {
                            html = renderHtml(f);
                            $('tbody').append(html);
                            clickAction();
                            download();
                        })
                    }
                } else {
                    $('tbody').append('<p class="text-danger" style="padding:20px 0 0 20px">Không có kết quả nào !</p>');
                }
            }
        })
    })
})