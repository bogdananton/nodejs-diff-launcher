var path  = require('path');
var shell = require('nw.gui').Shell;
fs = require('fs');

var DiffLauncher = {
  // HTML items
  list_container     : null,
  buttons_container  : null,
  progress_container : null,
  progress_cursor    : null,
  overlay_container  : null,
  filelist_container : null,
  diff_container     : null,
  repo_container     : null,

  // path configuration
  diff_command: null,
  repo1: null,
  repo2: null,

  diff_items: null,
  platform: process.platform,

  initialize: function(configuration){
    if( configuration ){
      localStorage.diff_command = configuration.diff;
      localStorage.repo1 = configuration.repo1;
      localStorage.repo2 = configuration.repo2;
    }

    this.diff_command = localStorage.diff_command;
    this.repo1 = localStorage.repo1;
    this.repo2 = localStorage.repo2;

    // setup
    this.buttons_container  = document.getElementById('menu');
    this.list_container     = document.getElementById('list');
    this.progress_container = document.getElementById('progress');
    this.progress_cursor    = document.getElementById('progress_cursor');
    this.filelist_container = document.getElementById('file_list');
    this.overlay_container  = document.getElementById('overlay');
    this.diff_container     = document.getElementById('diff_container');
    this.repo_container     = document.getElementById('repo_list');

    this.diff_container.value = this.diff_command;
    this.repo_container.querySelector('#repo1_container').value = this.repo1;
    this.repo_container.querySelector('#repo2_container').value = this.repo2;

    // bind button events
    this.buttons_container.querySelector('#new_list').addEventListener('click', function(){
      this.new_list();
    }.bind(this));

    this.buttons_container.querySelector('#open_list').addEventListener('click', function(){
      this.open_list_item();
    }.bind(this));

    this.buttons_container.querySelector('#setup_diff').addEventListener('click', function(){
      this.open_diff_item();
    }.bind(this));

    this.buttons_container.querySelector('#setup_repo').addEventListener('click', function(){
      this.open_repo_item();
    }.bind(this));

    this.overlay_container.querySelector('#update_action').addEventListener('click', function(){
      this.run_progress();

      if(this.diff_container.style.display == 'block'){
        this.diff_command = this.diff_container.value;

      } else if(this.repo_container.style.display == 'block'){
        this.repo1 = this.repo_container.querySelector('#repo1_container').value;
        this.repo2 = this.repo_container.querySelector('#repo2_container').value;

      } else if(this.filelist_container.style.display == 'block'){

        var lines = this.filelist_container.value.split('\n');
        for(var i = 0; i < lines.length; i++){
          var file = lines[i];

          if(file.substr(0, 1) == '/') {
            file = file.substr(1);
          }

          if(this.platform == 'win32'){
            file = file.replace(/\//, '\\');
          } else {
            file = file.replace(/\\/, '/');
          }

          var full_path_file_repo1 = this.repo1 + file;
          var full_path_file_repo2 = this.repo2 + file;

          if(file.replace(/^\s\s*/, '').replace(/\s\s*$/, '') != '' && fs.existsSync(full_path_file_repo1) && fs.existsSync(full_path_file_repo2)){
            this.diff_items.push(file);
          }
        }

        if(this.diff_items.length > 0){
          while( this.list_container.hasChildNodes() ){
            this.list_container.removeChild(this.list_container.lastChild);
          }

          this.diff_items.forEach(function(file) {
            var diff_item = document.createElement('li');
            diff_item.className = 'diff_item';
            diff_item.setAttribute('data-file', file);

            this.list_container.appendChild(diff_item);

            var button_diff_run = document.createElement('button');
            button_diff_run.className = 'diff_run';
            button_diff_run.setAttribute('title', 'Run Diff');
            diff_item.appendChild(button_diff_run);

            var span_text = document.createElement('span');
            span_text.innerHTML = file;
            diff_item.appendChild(span_text);

            var button_diff_remove = document.createElement('button');
            button_diff_remove.className = 'diff_remove';
            button_diff_remove.setAttribute('title', 'Remove File');
            diff_item.appendChild(button_diff_remove);

            button_diff_run.addEventListener('click', function(ev){
              this.event_run_diff_item(file, ev);
            }.bind(this));

            button_diff_remove.addEventListener('click', function(ev){
              this.event_remove_diff_item(file, ev);
            }.bind(this));

          }.bind(this));

        } else {
          this.new_list();
        }
      }

      this.update_configuration();
      this.hide_overlay();

    }.bind(this));

    // clear / init item list
    this.new_list();
  },

  new_list: function() {
    this.list_container.innerHTML = '<li class="blank">No items added... <span style="float:right">:(</span></li>';
    this.diff_items = [];
    this.run_progress();
  },

  run_progress: function(callback) {
    if(this.progress_container.style.display == 'block') {
      return false;
    }

    this.progress_container.style.display = 'block';
    this.progress_cursor.className = '';

    setTimeout(function() { 
      this.progress_cursor.className = 'full_width'; 
    }.bind(this), 50);
    
    setTimeout(function() { 
      this.progress_container.style.display = 'none';
    }.bind(this), 900);
  },

  open_list_item: function() {
    this.overlay_container.style.display = 'block';
    this.filelist_container.style.display = 'block';
    this.filelist_container.style.height = (window.innerHeight - 65) + 'px';
  },

  open_diff_item: function() {
    this.overlay_container.style.display = 'block';
    this.diff_container.style.display = 'block';
    this.diff_container.style.marginTop = (window.innerHeight / 2 - 45) + 'px';
  },

  open_repo_item: function() {
    this.overlay_container.style.display = 'block';
    this.repo_container.style.display = 'block';
    this.repo_container.style.marginTop = (window.innerHeight / 2 - 115) + 'px';
  },

  resize: function() {
    if(this.overlay_container.style.display != 'block'){
      return false;
    }

    this.filelist_container.style.height = (window.innerHeight - 65) + 'px';
    this.diff_container.style.marginTop = (window.innerHeight / 2 - 45) + 'px';
    this.repo_container.style.marginTop = (window.innerHeight / 2 - 85) + 'px';
  },

  hide_overlay: function() {
    this.overlay_container.style.display = 'none';
    this.diff_container.style.display = 'none';
    this.repo_container.style.display = 'none';
    this.filelist_container.style.display = 'none';
  },

  update_configuration: function() {
    localStorage.diff_command = this.diff_command;
    localStorage.repo1 = this.repo1;
    localStorage.repo2 = this.repo2;
  },

  event_run_diff_item: function(file, event) {
    var li_parent = event.target.parentNode;
    li_parent.className = 'diff_item was_launched';

    var full_path_file_repo1 = this.repo1 + file;
    var full_path_file_repo2 = this.repo2 + file;

    var spawn = require('child_process').spawn,
    grep  = spawn(this.diff_command, [full_path_file_repo1, full_path_file_repo2]);
  },

  event_remove_diff_item: function(file, event) {
    var li_parent = event.target.parentNode;
    var position = this.diff_items.indexOf(file);

    if(position >= 0){
      this.diff_items.splice(position, 1);
    }

    this.list_container.removeChild(li_parent);

    if(this.diff_items.length == 0){
      this.new_list();
    }
  }
}

window.addEventListener('load', function() {

  if(null === localStorage.diff_command){  
    fs.readFile('config.json', 'utf8', function (err,data) {

      var configuration = JSON.parse(data);
      DiffLauncher.initialize(configuration);
    });
  } else {
    DiffLauncher.initialize();
  }

});


var resizeWatcher = null;
window.addEventListener('resize', function() {
  if(null !== resizeWatcher){
    clearTimeout(resizeWatcher);
  }

  resizeWatcher = setTimeout(function() {
    DiffLauncher.resize();
  }, 50);
});