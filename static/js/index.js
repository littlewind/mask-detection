var width = 320; // We will scale the photo width to this
var height = 0; // This will be computed based on the input stream

var video = null;
var canvas = null;
var photo = null;
var startbutton = null;

function startup() {
    video = document.getElementById('image');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('startbutton');

    width = video.clientWidth;
    height = video.clientHeight;
    canvas.width = width;
    canvas.height = height;


    startbutton.addEventListener('click', function (ev) {
        takePicture();
        ev.preventDefault();
    }, false);

    clearPhoto();
}

function clearPhoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/jpeg');
    photo.setAttribute('src', data);
}

function takePicture() {
    console.log('clicked');
    var context = canvas.getContext('2d');
    var mimeType = 'image/png';
    if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        var data = canvas.toDataURL(mimeType);

        canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.addEventListener('loadend', () => {
                const arrayBuffer = reader.result;

                // Dispay Blob content in an Image.
                const blob = new Blob([arrayBuffer], {type: mimeType});
                file_select_handler(blob);
            });
            reader.readAsArrayBuffer(blob);
        }, mimeType);
        photo.setAttribute('src', data);
    } else {
        clearPhoto();
    }
}

function sse() {
    var source = new EventSource('/stream');
    source.onmessage = function (e) {
        if (e.data == '')
            return;
        var data = $.parseJSON(e.data);
        var upload_message = 'Image uploaded by ' + data['ip_addr'];
        var image = $('<img>', {alt: upload_message, src: data['src']});
        var container = $('<div>').hide();
        container.append($('<div>', {text: upload_message}));
        container.append(image);
        $('#images').prepend(container);
        image.load(function () {
            container.show('blind', {}, 1000);
        });
    };
}

function file_select_handler(to_upload) {
    var progressbar = $('#progressbar');
    var status = $('#status');
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('loadstart', function (e1) {
        status.text('uploading image');
        progressbar.progressbar({max: e1.total});
    });
    xhr.upload.addEventListener('progress', function (e1) {
        if (progressbar.progressbar('option', 'max') == 0)
            progressbar.progressbar('option', 'max', e1.total);
        progressbar.progressbar('value', e1.loaded);
    });
    xhr.onreadystatechange = function (e1) {
        if (this.readyState == 4) {
            if (this.status == 200)
                var text = 'upload complete: ' + this.responseText;
            else
                var text = 'upload failed: code ' + this.status;
            status.html(text + '<br/>Select an image');
            progressbar.progressbar('destroy');
        }
    };
    xhr.open('POST', '/post', true);
    xhr.send(to_upload);
};

function handle_hover(e) {
    e.originalEvent.stopPropagation();
    e.originalEvent.preventDefault();
    e.target.className = (e.type == 'dragleave' || e.type == 'drop') ? '' : 'hover';
}

$('#drop').bind('drop', function (e) {
    handle_hover(e);
    if (e.originalEvent.dataTransfer.files.length < 1) {
        return;
    }
    file_select_handler(e.originalEvent.dataTransfer.files[0]);
}).bind('dragenter dragleave dragover', handle_hover);
$('#file').change(function (e) {
    file_select_handler(e.target.files[0]);
    e.target.value = '';
});
sse();

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-510348-17']);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
    window.addEventListener('load', startup, false);

})();