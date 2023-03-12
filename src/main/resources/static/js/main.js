/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * RequireJS configuration with all possible dependencies
 */
requirejs.config({
    baseUrl: '/bower_components',
    paths: {
        'jquery': 'jquery/dist/jquery.min'
    }
});

/**
 * Suggestions on the main page
 */
require(['jquery'],
    function ($) {
        $(".example").click(function(e) {
            $("#url").val($(this).attr("href")).trigger("change");
            e.preventDefault();
        });
    });

/**
 * Validation for form
 */
require(['jquery'],
    function ($) {
        var generalPattern = "\\/([A-Za-z0-9_.-]+)\\/([A-Za-z0-9_.-]+)\\/?(?:(?:tree|blob)\\/([^/]+)\\/?(.*)?)?$";
        var githubPattern = new RegExp("^https?:\\/\\/github\\.com" + generalPattern);
        var gitlabPattern = new RegExp("^https?:\\/\\/gitlab\\.com" + generalPattern);
        var gitPattern = new RegExp("^((git|ssh|http(s)?)|(git@[\\w\\.]+))(:(//)?)([\\w\\.@\\:/\\-~]+)(\\.git)(/)?$");

        /**
         * Show extra details in form if generic git repository
         */
        $("#url").on('change keyup paste', function () {
            var input = $(this).val();
            if (gitPattern.test(input)) {
                $("#extraInputs").fadeIn();
            } else {
                $("#extraInputs").fadeOut();
            }
        });

        /**
         * Clear warnings when fields change
         */
        $("input").keyup(function(e) {
            // Fix for enter key being detected as a change
            if (e.keyCode != 13) {
                var field = $(this);
                field.parent().removeClass("has-error");
                field.next().text("");
            }
        });

        /**
         * Validate form before submit
         */
        $('#add').submit(function() {
            var input = $("#url").val();
            if (gitPattern.test(input)) {
                var success = false;
                if (input.startsWith("ssh") || input.startsWith("git@")) {
                    addWarning("url", "SSH is not supported as a protocol, please provide a HTTPS URL to clone");
                } else {
                    success = true;
                    if (!$("#branch").val()) {
                        addWarning("branch", "You must provide a branch name for the workflow");
                        success = false;
                    }
                    if (!$("#path").val()) {
                        addWarning("path", "You must provide a path to the workflow or a directory of workflows");
                        success = false;
                    }
                }
                return success;
            } else if (!githubPattern.test(input) && !gitlabPattern.test(input)) {
                addWarning("url", "Must be a URL to a workflow or directory of workflows on gitlab.com or github.com, or a Git repository URL");
                return false;
            }
        });

        /**
         * Adds warning state and message to the a field
         * @param id The ID of the field
         * @param message The message to be displayed on the form element
         */
        function addWarning(id, message) {
            var field = $("#" + id);
            field.parent().addClass("has-error");
            field.next().text(message);
        }

        $("#url").trigger("change");
    });



const searchQueryRepos = 'https://api.github.com/orgs/phenoflow/repos';
const searchQueryHeader = 'https://api.github.com/repos/phenoflow/';

var m = new Map();
var defaults = new Map();
var URLs = [];

function loadInfo(){
    let xhttp = new XMLHttpRequest();
    xhttp.open('GET', searchQueryRepos, true);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var all = JSON.parse(this.response);
            all.forEach(element => {
                URLs.push(element['clone_url']);
                m.set(element['clone_url'], element['name']);
                defaults.set(element['clone_url'], element['default_branch']);
            });
            loadUrls();
        }
    }
    
    xhttp.send();
}


var url_selection = document.getElementById('url');
var branch_selection = document.getElementById('branch');
var path = document.getElementById('path');
var button = document.getElementById('parse');

function loadUrls(){
    for(var i=0;i<URLs.length;++i){
        var url = URLs[i];
        var name = m.get(url);
        var option = '<option value="'+ URLs[i]+'">'+ name +'</option>';
        url_selection.innerHTML += option;
    }
}

function loadBranch(){
    if (url_selection.value == ''){
        
    }
    else{
        var branches = [];
        branch_selection.innerHTML = '';
        var quest = searchQueryHeader + m.get(url_selection.value) + '/branches';
        let xhttp = new XMLHttpRequest();
        xhttp.open('GET', quest, true);
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var a = JSON.parse(this.response);
                if (a.length > 1){
                    a.forEach(element => {
                        branches.push(element['name']);
                    });
                }
                else {
                    branches.push(a[0]['name']);
                }
                for(var i=0;i<branches.length;++i){
                    var option = '';
                    if (branches[i] == defaults.get(url_selection.value)){
                        option = '<option value="'+ branches[i]+'" selected>'+branches[i]+'</option>';
                    }
                    else{
                        option = '<option value="'+ branches[i]+'">'+branches[i]+'</option>';
                    }
                    branch_selection.innerHTML += option;
                }
                selectPath();

            }
        }
        
        xhttp.send();
    }
    
}

function startWithUpper(c){
    if (c.charAt(0) == c.charAt(0).toUpperCase()){
        return true;
    }
    return false;
}

function isMainCWL(s){
    if (startWithUpper(s) && s.endsWith('.cwl') && !s.includes('inputs')){
        return true;
    }
    return false;
}

function selectPath(){
    if (url_selection.value != '' && branch_selection.value != ''){
        path.innerHTML = '';
        var quest = searchQueryHeader + m.get(url_selection.value) + '/git/trees/' + branch_selection.value;
        let xhttp = new XMLHttpRequest();
        xhttp.open('GET', quest, true);
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) 
            {
                var a = JSON.parse(this.response);
                if (a['tree'].length < 1){
                    path.value = 'Empty branch';
                    button.disabled = true;
                }
                else{
                    path.value= 'No main file found';
                    button.disabled = true;
                    for (var i = 0; i < a['tree'].length; ++i){
                        if (isMainCWL(a['tree'][i]['path'])){
                            path.value = a['tree'][i]['path'];
                            button.disabled = false;
                            break;
                        }
                    }
                }
                
            }
        }
        xhttp.send();

    }
    
    

    
}
    
loadInfo();