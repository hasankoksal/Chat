    var websckt = new WebSocket('ws://127.0.0.1:8000/ws/');
    var leaboard_sckt = new WebSocket('ws://127.0.0.1:8000/ws/leaboard/');
    var question_images = ["#Blue-arrow", "#Blue-twice", "#Blue-double", 
                           "#Red-arrow", "#Red-twice", "#Red-double"];
    var arrow_images = ["#Blue-arrow", "#Red-arrow"];
    var twice_images = ["#Blue-twice", "#Red-twice"];
    var double_images =["#Blue-double", "#Red-double"];
    var questions = {
        "W": [arrow_images, "turn-left"], 
        "S": [arrow_images, "turn-right"], 
        "A": [arrow_images, "turn-reverse"], 
        "D": [arrow_images, false], 
        "WS": [twice_images, "turn-left"], 
        "AD": [twice_images, false], 
        "WA": [double_images, "turn-left"], 
        "WD": [double_images, false], 
        "SD": [double_images, "turn-right"], 
        "SA": [double_images, "turn-reverse"], 
    };
    var reverse_answer = {
        "W": "S",
        "S": "W",
        "A": "D",
        "D": "A",
        "WS": "AD",
        "AD": "WS",
        "WA": "SD",
        "WD": "AS",
        "SD": "AW",
        "SA": "WD",
    };
    var question, time, user_name, interval, timeleft;
    var on_game = false, search_room=false;
    var winner = false;
    var user_answer = '', answer = '';
    var get_user_name = true;
    var active_box = "pink";
    var active_arrow = "#first";
    var pink_arrows_list = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12", "p13", "p14", "p15", "p16", "p17", "p18", "p19", "p20"];
    var yellow_arrows_list = ["y1", "y2", "y3", "y5", "y6", "y7", "y8", "y9", "y10"];
    var black_arrows_list = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10"];
    var users_arrows_list = ["first"];
    var user_pink_arrows = Number(sessionStorage.getItem("Pink Arrows"));
    var user_yellow_arrows = Number(sessionStorage.getItem("Yellow Arrows"));
    var user_black_arrows = Number(sessionStorage.getItem("Black Arrows"));
    if(!sessionStorage.getItem("Arrows")){
    sessionStorage.setItem("Arrows", JSON.stringify(users_arrows_list))
    }

    function how_to_play_click(){
        $('#How-to-play').modal('hide');
    }

    function user_answer_change(x, ans){
        user_answer = x;
        $('#AnswerBox').html("Your answer:"+ ans);
    }
    function Modal_shower(){
    $('#myModal').show();
    }
    function End_Modal_shower(text){
        if (text == 'WRONG!'){
            $('#endModalHeader').show();
            $('#endModalHeader').html(text);
            question_box_value = $('#ParentQuestionBox').html();
            $('#endModalBody').html(question_box_value);
        }
        else{
        $('#endModalHeader').hide();
        $('#endModalBody').html(text);
        }
    $('#LeaboardBox').modal('hide')
    $('#endModal').show();
    }

    function change_leaboard(usernames, moneys, ids, id){
            leaboard_html=`<tr>
<th>User</th>
<th></th>
<th>Money</th>
</tr>`;
            for(i=0; i<usernames.length;i++){
                leaboard_html += "<tr id='"+ ids[i] + "'><td>" + (i+1) + "." + usernames[i] + "</td><td>==></td><td>" + moneys[i] + "$</td></tr>"
            }
            $('#LeaboardList').html(leaboard_html)
            if(id){
            $("#" + id).css("color", "red")
            }
        }

        function open_leaboard(){
            $('#LeaboardBox').modal()
        }

    leaboard_sckt.onmessage = function(e){
        const data = JSON.parse(e.data)
        if(data.type == "leaboard"){
            change_leaboard(data.usernames, data.moneys, data.ids, data.id)
        }}

    function user_click(room_type){
        if(get_user_name){
        user_name = $('#user-name-text').val();
        websckt.send(JSON.stringify({
            'type': 'search_room',
            'message': user_name,
            'room_type': room_type,
        }));
        $('#Starter').hide()
        $('#Continue').show()
        search_room = true;
        get_user_name = false;
        leaboard_sckt.send(JSON.stringify({
            "type": "change_username",
            "username": user_name,
        }))
    }}

    function clear_question(){
        $('#CorrectBox').hide();
        $('#QuestionBox').show();
        for(i=0; i<question_images.length; i++){
            $(question_images[i]).hide();
            $(question_images[i]).removeClass($(question_images[i]).attr("class"));
        }
    }

    function show_question(){
        clear_question()
        question_image = questions[answer][0][question]
        if (questions[answer][1]){
            $(question_image).addClass(questions[answer][1])
        }
        $(question_image).show()
        timeleft = time;
        var totaltime = timeleft;
        $('#progressBar').find("div").removeClass("bg-success")
        $('#progressBar').find("div").addClass("bg-danger")
        select_progress(totaltime, $('#progressBar'), 'question');
    }
    function list_users(ids, usernames){
        var html_output = "";
        for(i=0; i<ids.length; i++){
            html_output += " <div class='user' id='" + ids[i] + "'>" + usernames[i] + "</div>";
            if(i<ids.length-1){
                html_output +=","
            }
        }
        $("#UsersBox").html(html_output);
    }
    function on_lose_another(id){
        var tag_id = "#" + id;
        $(tag_id).removeClass("user");
        $(tag_id).addClass("loser");
    }
    function send_correct(){
        websckt.send(JSON.stringify({
            'type': 'correct',
        }));
        leaboard_sckt.send(JSON.stringify({
            "type": "change_money",
            "money": sessionStorage.getItem("Money")
        }))
    }
    function wait_message(e){

        const data = JSON.parse(e.data);
        if (data.type == 'question'){
            question = data.question;
            answer = data.answer;
            time = data.time;
            if (!on_game){
                show_question();
                search_room = false;
                on_game = true;
            }
        }
        if (data.type == 'start'){
            $('#myModal').hide();
            $('#GameBox').show();
            $('#buttons').show();
            list_users(data.ids, data.usernames);
        }
        if (data.type == 'win'){
            $('#GameBox').hide();
            $('#buttons').hide();
            End_Modal_shower('YOU ARE WİNNER!');
            websckt.close(1000);
            clearInterval(interval);
                on_game = false;
            if(typeof nextButton !== 'undefined'){
            nextButton.addEventListener('mouseUp', function () {
                if (typeof gdsdk !== 'undefined' && gdsdk.showAd !== 'undefined') {
                     gdsdk.showAd();
                }
            });
        }
        }
        if (data.type == 'lose_another'){
            on_lose_another(data.id);
        }
        if (data.type == 'leave_doubt'){
            clearInterval(interval)
            End_Modal_shower("Are you leave the window?")
            websckt.close();
            on_game = false;
            if(typeof nextButton !== 'undefined'){
                nextButton.addEventListener('mouseUp', function () {
                    if (typeof gdsdk !== 'undefined' && gdsdk.showAd !== 'undefined') {
                        gdsdk.showAd();
                    }
                });
            }
        }
    }
        websckt.onmessage = function (e){wait_message(e);};

    function select_progress(totaltime, $element, why){
        if (screen.width<768){
            interval = setInterval(function(){
                $element.find('div').width("100%")
                small_progress(totaltime, $element, why);
            }, 50);
        }
        else{
            interval = setInterval(function(){
                big_progress(totaltime, $element, why);
            }, 50);
        }
    }

    function big_progress(timetotal, $element, why) {
    var progressBarWidth = Math.floor(timeleft * 100 / timetotal);
    timeleft -= 5;
    $element.find('div').width(progressBarWidth + "%")
    $element.find('div').html(Math.floor(timeleft/10)/10)
    if(timeleft > 0) {
    }
    else {
        if (why === 'question'){
            clearInterval(interval);
            control_answer();
        }
        if (why === 'wait'){
            clearInterval(interval)
            show_question();
        }
    }
}

    function small_progress(timetotal, $element, why){
        timeleft -= 5;
        if(timeleft<100){
            $element.find('div').html(Math.floor(timeleft/10)/10)
        }
        else{
            $element.find('div').html(Math.floor(Math.floor(timeleft/10)/10))
        }
        if(timeleft > 0) {
        }
        else {
            if (why === 'question'){
                clearInterval(interval);
                control_answer();
            }
            if (why === 'wait'){
                clearInterval(interval)
                show_question();
            }
        }
    }

    function control_answer(){
        true_answer = answer
        if(question){true_answer=reverse_answer[answer]}
        if (!(user_answer == '') && !(true_answer.search(user_answer) == '-1')){
            correct_answer();
            user_answer_change('', '');
        }
        else{
            wrong_answer();
        }
    }
    function correct_answer(){
        $('#QuestionBox').hide();
        $('#CorrectBox').show();
        timeleft = 100;
        var totaltime = timeleft;
        $('#progressBar').find("div").removeClass("bg-danger")
        $('#progressBar').find("div").addClass("bg-success")
        select_progress(totaltime, $('#progressBar'), 'wait');
        send_correct();
        question_number = sessionStorage.getItem("Money")
        multipler = sessionStorage.getItem("Multipler")
        sessionStorage.setItem("Money", String(Number(question_number)+Number(multipler)))
        show_money()
        leaboard_sckt.send(JSON.stringify({
            "type": "change_money",
            "money": sessionStorage.getItem("Money")
        }))
    }

    function wrong_answer(){
        websckt.send(JSON.stringify({
            'type': 'lose',
        }));
        $('#GameBox').hide()
        $('#buttons').hide()
        End_Modal_shower("WRONG!");
        websckt.close();
        on_game = false;
        if(typeof nextButton !== 'undefined'){
        nextButton.addEventListener('mouseUp', function () {
            if (typeof gdsdk !== 'undefined' && gdsdk.showAd !== 'undefined') {
                 gdsdk.showAd();
            }
        });
    }
    }

    function show_money(){
        $("#ChangeQuestionNumber").html(
        sessionStorage.getItem("Money")
        )
        $("#MultiplerNumber").html(
            sessionStorage.getItem("Multipler")
        )
    }

    function show_multipler_number(){
        multipler = sessionStorage.getItem("Multipler");
        $("#MultiplerNumber").html(multipler + "x")
    }

    function show_market_box(){
        switch(active_box){
            case "pink":
                $('#pink-area').show()
                $('#yellow-area').hide()
                $('#black-area').hide()
                break;
            case "yellow":
                $('#pink-area').hide()
                $('#yellow-area').show()
                $('#black-area').hide()
                break;
            case "black":
                $('#pink-area').hide()
                $('#yellow-area').hide()
                $('#black-area').show()
                break;
        }
    }

    function open_market(){
        $('#MarketBox').show();
        $('#myModal').hide();
        show_market_box();
    }

    function market_button_click(x){
        active_box = x
        show_market_box()
    }

    function choose_arrow(arrow_list){
        arrow_number = Math.floor(Math.random() * arrow_list.length)
        if (!users_arrows_list.includes(arrow_list[arrow_number])){
        users_arrows_list.push(arrow_list[arrow_number])
        }
        else{
            choose_arrow(arrow_list)
        }
    }

    function buy_click(){
        money = Number(sessionStorage.getItem("Money"))
        multipler = Number(sessionStorage.getItem("Multipler"))
        users_arrows_list = JSON.parse(sessionStorage.getItem("Arrows"))
        user_pink_arrows = Number(sessionStorage.getItem("Pink Arrows"))
        user_yellow_arrows = Number(sessionStorage.getItem("Yellow Arrows"))
        user_black_arrows = Number(sessionStorage.getItem("Black Arrows"))
        switch(active_box){
            case "pink":
            if (user_pink_arrows == pink_arrows_list.length){
                alert("I don't have any pink box")
                break;
            }
            if (!(money<25)){
                choose_arrow(pink_arrows_list)
                money = String(money - 25)
                multipler = String(Number(multipler) + 1)
                user_pink_arrows += 1
            }
            else{
                alert("You haven't money yet!")
            }
                break;
            case "yellow":
            if (user_yellow_arrows == yellow_arrows_list.length){
                alert("I don't have any yellow box")
                break;
            }
            if (!(money<250)){
                choose_arrow(yellow_arrows_list)
                money = String(money - 250)
                multipler = String(multipler + 13)
                user_yellow_arrows += 1
            }
                else{
                alert("You haven't money yet!")
            }
                break;
            case "black":
            if (user_black_arrows == black_arrows_list.length){
                alert("I don't have any black box")
                break;
            }
            if (!(money<1000)){
                choose_arrow(black_arrows_list)
                money = String(money - 1000)
                multipler = String(multipler + 50)
                user_black_arrows += 1
            }
            else{
                alert("You haven't money yet!")
            }
                break;
        }
        sessionStorage.setItem("Money", money);
        sessionStorage.setItem("Multipler", multipler);
        sessionStorage.setItem("Arrows", JSON.stringify(users_arrows_list))
        sessionStorage.setItem("Pink Arrows", user_pink_arrows)
        sessionStorage.setItem("Yellow Arrows", user_yellow_arrows)
        sessionStorage.setItem("Black Arrows", user_black_arrows)
        show_money();
        leaboard_sckt.send(JSON.stringify({
            "type": "change_money",
            "money": sessionStorage.getItem("Money")
        }))
    }

    function market_return_click(){
        $('#MarketBox').hide();
        Modal_shower();
    }

    function arrows_list(){
        $('#MarketBox').hide();
        $('#ArrowBox').show();
        users_arrows_list = JSON.parse(sessionStorage.getItem("Arrows"));
        arrows = "";
        for(i=0; i<users_arrows_list.length; i++){
            arrows += "<img src='"+ photos[users_arrows_list[i]] + "'id='" + users_arrows_list[i] + "' class='listed-arrow'>"
        }
        $('#ArrowList').html(arrows);
        $(active_arrow).css("border-color", "blue");
        $(".listed-arrow").click(function(){
            change_arrows($(this).attr("src"))
            $('.listed-arrow').css("border-color", "white")
            $(this).css("border-color", "blue")
            active_arrow = "#" + this.id;
        })
    }

    function change_arrows(source){
        $('.game-button').attr("src", source)
    }

    function list_return_click(){
        $('#ArrowBox').hide()
        $('#MarketBox').show()
    }

    function leave_site(){
        if(on_game){
        End_Modal_shower("YOU LEFT AND LOSE!");
        clearInterval(interval);
        websckt.close(1000);
        }
        if(search_room){
            websckt.close(1000);
            $('#myModal').modal('hide');
            End_Modal_shower('PLEASE WAIT CREATING GAME AGAIN!');
        }}

    function play_again(){
        websckt = new WebSocket('ws://' + window.location.host + '/ws/');
        websckt.onmessage = function (e){wait_message(e);}
        question = null;
        time = null;
        user_name = null;
        interval = null;
        timeleft = null;
        on_game = false;
        search_room = false;
        winner = false;
        user_answer_change('', '');
        answer = '';
        get_user_name = true;
        $("#UsersBox").html('');
        clear_question();
        $('#CorrectBox').hide();
        $('#QuestionBox').show();
        $('#endModal').hide();
        Modal_shower();
        $('#Starter').show();
        $('#Continue').hide();
    }
