$(function(){
    $("#add-comment").on("click", function(event){    
        if(!$("#comment").length){
            let comment = `
                <div class="form-group">
                    <textarea class="form-control" rows="5" placeholder="Description" id="comment" name="comment[text]" autofocus></textarea>
                </div>
                ` ;

            $("#submit-comment").prepend(comment);
            event.preventDefault();
        } else if ($("#comment").length && $.trim($("#comment").val())){
            $("#add-comment").submit();
        } else {
            event.preventDefault();
        }


        
        

        // if($("#comment").length){
        //     if($.trim($("#comment").val())){
        //         console.log("not empty???");
        //         $("add-comment").submit();
        //     } else {
        //         console.log("empty");
        //     };
        // } else {
        //     let comment = `
        //     <div class="form-group">
        //         <textarea class="form-control" rows="5" placeholder="Description" id="comment" name="comment[text]"></textarea>
        //     </div>
        //     ` ;
        //     let t = $("#add-comment");
            
        //     $(comment).insertBefore(t.parent());

        // }
        
    });
});