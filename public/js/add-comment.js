$(function(){
    // hide the comment when loading
    $("#comment").toggle();

    $("#add-comment").on("click", function(event){

        if($("#comment").is(":visible") && $.trim($("#comment").val())){
            // comment text is not empty
            $("#add-comment").submit();
        } else {
            // if element is hidden
            $("#comment").toggle();
            event.preventDefault();
        }
    });
});