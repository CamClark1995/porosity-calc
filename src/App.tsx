import React from 'react';
import './App.css';

// const ColorAnalyzer = require('rgbaster');

const App = () => {

  const [imageUri, setImageUri] = React.useState<string>("");
  const [porosity, setPorosity] = React.useState<number>(-1);

  const updateImage = (files: FileList | null): void => {
    if (imageUri) {
      // Clear canvas/porosity
      const canvas: HTMLCanvasElement = document.getElementById('img-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setPorosity(-1);
    }

    if (files === null || files[0] === null) {
      console.error("No file found, returning");
      return;
    }
    else if (files.length > 1)
      console.log("Multiple files found, using first");

    fileToDataUri(files[0])
      .then(dataUri => setImageUri(dataUri));
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    })
  };

  // const getDominantColors = async () => {
  //   const result = await ColorAnalyzer(imageUri);
  //   console.log(result);
  // };

  const convertToBlackAndWhite = () => {
    const img: HTMLElement | null = document.getElementById('img');
    const canvas: HTMLCanvasElement = document.getElementById('img-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    // Set canvas width/height to image width/height
    canvas.width = img?.clientWidth ?? 0;
    canvas.height = img?.clientHeight ?? 0;

    // Clear canvas
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the uploaded image to the canvas
    let canvasImg = img as CanvasImageSource;
    ctx?.drawImage(canvasImg, 0, 0);

    // Get ImageData obj from canvas
    let imgData: ImageData | undefined = ctx?.getImageData(0, 0, canvas.width, canvas.height);

    if (imgData) {
      let blackCount: number = 0;
      let whiteCount: number = 0;

      // Loop through the pixel data (rgb values) of the image
      for (let i = 0; i < imgData?.data.length; i += 4) {

        // Total up the rgb values of the pixel
        let count = imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2];

        let color: number = 0;

        // If rgb total is less than 382 (half the max), set color to 0 (black)
        if (count < 382) {
          color = 0;
          blackCount++;
        }
        // If rgb total is greater than 382, set color to 255 (white)
        else {
          color = 255;
          whiteCount++;
        }

        // Update the color of the pixel to either black/white
        imgData.data[i] = color;
        imgData.data[i + 1] = color;
        imgData.data[i + 2] = color;
        imgData.data[i + 3] = 255;
      }

      // Draw the black and white image back to the canvas
      ctx?.putImageData(imgData, 0, 0);

      // Determine the percentage of black pixels - this will be the porosity
      let porosity = ((blackCount / (whiteCount + blackCount)) * 100);

      // Round to two decimal places
      setPorosity(parseFloat(porosity.toFixed(2)));
    }
  };

  return (
    <div className="App">
      <form>
        <h2>Select Image to Calculate Porosity</h2>
        <input
          type="file"
          id="select-image"
          accept="image/*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateImage(e.target.files)}
        />
        <div id="capture-div">
          <div><b>OR</b></div>
          <input
            id="capture-button"
            type="button"
            value="Capture Image"
            onClick={() => document.getElementById('capture-image')?.click()}
          />
        </div>
        <input
          id="capture-image"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateImage(e.target.files)}
        />
      </form>

      {imageUri && <img id="img" src={imageUri} alt='img cannot be displayed'></img>}
      <div>{imageUri && <button onClick={() => convertToBlackAndWhite()}>Calculate Porosity</button>}</div>
      <div><canvas id="img-canvas"></canvas></div>
      {porosity > 0 && <h2>Porosity: {porosity}%</h2>}
    </div>
  );
}

export default App;
