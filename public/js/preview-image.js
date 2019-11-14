$(function() {
    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('#image-preview').attr('src', e.target.result);
                $("#image-preview").show();
            };

            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#image-preview").hide(); // hide when loading page

    $("#inputGroupFile01").change(function(){
        $(this).next('.custom-file-label').html(event.target.files[0].name);
        readURL(this);                
    });
});