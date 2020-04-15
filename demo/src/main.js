const worker = new Worker('worker.js');

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("#canvas");
  const uploadElm = document.getElementById("upload");
  const uploadedElm = document.getElementById("uploaded");
  const uploadArea = document.getElementById("upload-area");
  const closeBtn = document.querySelector("#close");
  const swapBtn = document.querySelector("#swap");
  const defaultImage = document.getElementById("original-image");
  const beforeImage = document.querySelector("#beforeImage");
  const beforeImageSwap = document.querySelector("#beforeImageSwap");
  const colorSizeElm = document.querySelector("#colorSize");
  const spinnerElm = document.querySelector("#spinner");

  const cluster = new Cluster({ canvas });

  uploadArea.addEventListener("change", (e) => {
    showPreviewArea();
    changeHandler({
      e,
      callback: (image) => {
        preview(image);
      },
    });
  });
  uploadArea.addEventListener("dragenter", (e) => {
    e.preventDefault();
  });
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  uploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
  });
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    showPreviewArea();
    changeHandler({
      e,
      data: e.dataTransfer.files[0],
      callback: (image) => {
        preview(image);
      },
    });
  });

  closeBtn.addEventListener("click", () => {
    resetPreview(beforeImage);
  });

  swapBtn.addEventListener("click", () => {
    swapImage();
  });

  colorSizeElm.addEventListener("change", (e) => {
    showSpinner();
    cluster.reduce(Number(e.target.value));
  });

  const swapImage = () => {
    if (canvas.classList.contains("hidden")) {
      canvas.classList.remove("hidden");
      beforeImageSwap.classList.add("hidden");
    } else {
      canvas.classList.add("hidden");
      beforeImageSwap.classList.remove("hidden");
    }
  };

  const showPreviewArea = () => {
    uploadElm.classList.add("hidden");
    uploadedElm.classList.remove("hidden");
  };

  const hidePreviewArea = () => {
    uploadElm.classList.remove("hidden");
    uploadedElm.classList.add("hidden");
  };

  const preview = (image) => {
    showSpinner();
    cluster.reduce(4, image);
    beforeImage.src = image.src;
    beforeImageSwap.src = image.src;
    showPreviewArea();
  };

  const resetPreview = () => {
    cluster.restore();
    beforeImage.src = "";
    beforeImageSwap.src = "";
    colorSizeElm.value = 4;
    hidePreviewArea();
  };

  const showSpinner = () => {
    canvas.classList.add('opacity-25');
    spinnerElm.classList.remove('hidden');
  };

  const hideSpinner = () => {
    canvas.classList.remove('opacity-25');
    spinnerElm.classList.add('hidden');

  };

  worker.addEventListener('message', (response) => {
    cluster.draw(response.data);
    hideSpinner();
  });

  showPreviewArea();
  defaultImage.addEventListener("load", (image) => {
    preview(defaultImage);
  });
});

const changeHandler = ({ e, data, callback }) => {
  // drag and dropの場合は e.dataTransfer.files[0] を使用
  let file = data === undefined ? e.target.files[0] : data;

  // 拡張子チェック
  if (!file.type.match(/^image\/(png|jpg|jpeg|gif)$/)) {
    return;
  }

  // 容量チェック(5MB)
  if (5 * 1024 * 1024 <= file.size) {
    return;
  }

  let image = new Image();
  let fileReader = new FileReader();

  fileReader.onload = (e) => {
    let base64 = e.target.result;

    image.onload = () => {
      callback(image);
    };
    image.src = base64;
  };

  fileReader.readAsDataURL(file);
};

export default class Cluster {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.__image = null;
  }

  restore() {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  reduce(size = 2, image) {
    if (!!image) {
      this.__image = image;
    }
    this.canvas.width = this.__image.width;
    this.canvas.height = this.__image.height;
    const ctx = this.canvas.getContext("2d");
    ctx.drawImage(
      this.__image,
      0,
      0,
      this.__image.width,
      this.__image.height,
      0,
      0,
      this.__image.width,
      this.__image.height
    );

    let imageData = ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    worker.postMessage({ imageData, size }, [imageData.data.buffer]);
  }

  draw(imageData) {
    const ctx = this.canvas.getContext("2d");
    ctx.putImageData(imageData, 0, 0, 0, 0, imageData.width, imageData.height);
  }
}
