"use strict";

var port = window.location.port;
var baseUrl = window.location.protocol + '//' + window.location.hostname;
baseUrl = (port === 80 || port === 443) ? baseUrl : baseUrl + ':' + port;

new Vue({
  el: "#app",
  data() {
    return {
      photoBasePath: baseUrl + "/images/",
      uploadFiles: [],
      uploadPercentage: 0,
      index: null
    };
  },
  beforeMount() {
    this.loadPhotos();
  },
  mounted() {
    var vm = this;
    const fileUploader = document.querySelector(".file-uploader");

    fileUploader.addEventListener("dragenter", function(e) {
      this.classList.toggle("is-dragover");
    });

    fileUploader.addEventListener("dragleave", function(e) {
      this.classList.toggle("is-dragover");
    });

    fileUploader.addEventListener("drop", function(e) {
      e.preventDefault();
      this.classList.toggle("is-dragover");
      vm.upload(e.dataTransfer.files);
    });
  },
  methods: {
    loadPhotos: function() {
      let vm = this;
      axios.get("/images").then(function(res) {
        let data = res.data;

        for (let file of data.files) {
          vm.uploadFiles.push(vm.photoBasePath + file);
        }
      });
    },
    onBrowse(e) {
      this.upload(e.target.files);
    },
    upload: function(files) {
      if (!files.length) return;

      var vm = this;

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }

      axios
        .post("/images/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: function(progressEvent) {
            var progressPercent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            if (vm.onProgress) vm.onProgress(progressPercent);
            return progressPercent;
          }
        })
        .then(function(res) {
          let data = res.data;
          if (data.status) {
            for (let file of data.files) {
              vm.uploadFiles.unshift(vm.photoBasePath + file);
            }
          } else {
            alert("Something Error!!");
          }
        })
        .catch(function(e) {
          alert("Something Error!!");
        });
    },
    onProgress(percent) {
      this.uploadPercentage = percent === 100 ? 0 : percent;
    },
    deletePhoto: function(file) {
      var vm = this;

      let index = this.uploadFiles.findIndex(function(f) {
        return f === file;
      });

      file = file.replace(this.photoBasePath, "");

      axios.delete("/images/" + file).then(function(res) {
        let data = res.data;

        if (data.status) {
          vm.uploadFiles.splice(index, 1);
        } else {
          alert("Delete Error!!");
        }
      });
    },
    getFilename: function(file) {
      return decodeURIComponent(file.replace(this.photoBasePath, ""));
    }
  },
  components: {
    gallery: VueGallery
  }
});
