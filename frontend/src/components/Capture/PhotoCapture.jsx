import React, { useRef, useState, useEffect, useMemo } from 'react';
import './PhotoCapture.css';

export default function PhotoCapture({ onUploadSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Manage preview URL lifecycle safely to prevent memory leaks
  const previewUrl = useMemo(() => {
    if (!capturedImage) return null;
    return URL.createObjectURL(capturedImage);
  }, [capturedImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setErrorMessage('');

    if (!window.isSecureContext) {
      setErrorMessage('Camera access needs HTTPS on your phone. You can still choose a photo.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('This browser does not support camera access. You can still choose a photo.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      const cameraMessages = {
        NotAllowedError: 'Camera permission was denied. Allow camera access in browser settings, then try again.',
        NotFoundError: 'No camera was found on this device. You can still choose a photo.',
        NotReadableError: 'The camera is busy in another app. Close it and try again.',
        SecurityError: 'Camera access was blocked because this page is not using HTTPS.',
      };
      setErrorMessage(
        cameraMessages[error.name] || "Camera couldn't open. You can still choose a photo!"
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedImage(blob);
        stopCamera();
      }
    }, 'image/jpeg', 0.85);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrorMessage('Please pick a regular picture (JPEG, PNG, or WEBP).');
        return;
      }
      setCapturedImage(file);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setErrorMessage('');
    // Clear input so re-selecting the exact same file fires onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    startCamera();
  };

  const submitPhoto = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    setErrorMessage('');

    const formData = new FormData();
    // Preserve extension or default to .jpg
    const filename = capturedImage.name || 'capture.jpg';
    formData.append('photo', capturedImage, filename);

    try {
      const res = await fetch('/api/capture/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Let’s try again!');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="capture-container">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="viewfinder-box">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-preview"
          />
        ) : (
          <img
            src={previewUrl}
            alt="Captured item"
            className="image-preview"
          />
        )}
      </div>

      {errorMessage && (
        <div className="error-badge" role="alert">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="button-group">
        {!capturedImage ? (
          <>
            <button
              type="button"
              className="action-btn snap-btn"
              onClick={takePhoto}
              aria-label="Take picture"
            >
              <span className="btn-icon">📸</span>
              <span className="btn-label">Snap!</span>
            </button>
            <button
              type="button"
              className="action-btn alt-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload from files"
            >
              <span className="btn-icon">📁</span>
              <span className="btn-label">Choose</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="action-btn retry-btn"
              onClick={retakePhoto}
              disabled={isUploading}
              aria-label="Try again"
            >
              <span className="btn-icon">🔄</span>
              <span className="btn-label">Try Again</span>
            </button>
            <button
              type="button"
              className="action-btn confirm-btn"
              onClick={submitPhoto}
              disabled={isUploading}
              aria-label="Explore this object"
            >
              <span className="btn-icon">✨</span>
              <span className="btn-label">{isUploading ? 'Sending...' : 'Explore!'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}