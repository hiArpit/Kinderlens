import React, { useRef, useState, useEffect, useMemo } from 'react';
import './PhotoCapture.css';
import { childSessionHeaders, hasChildSession } from '../../childSession';

const PHOTO_RETRY_MESSAGE = 'I couldn’t explore that picture just now. Please try again in a little bit.';

export default function PhotoCapture({ onUploadSuccess, language = 'english', childProfileId = '' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const cameraRequestId = useRef(0);

  const [stream, setStream] = useState(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
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
    return () => {
      cameraRequestId.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video || capturedImage) return undefined;
    video.srcObject = stream;

    const updateVideoDimensions = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setCameraReady(true);
      }
    };
    video.addEventListener('loadedmetadata', updateVideoDimensions);
    if (video.readyState >= 1) updateVideoDimensions();
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('loadedmetadata', updateVideoDimensions);
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [stream, capturedImage]);

  const startCamera = async () => {
    setErrorMessage('');
    setCameraReady(false);
    const requestId = ++cameraRequestId.current;

    if (!window.isSecureContext) {
      setErrorMessage('Camera access needs HTTPS on your phone. You can still choose a photo.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('This browser does not support camera access. You can still choose a photo.');
      return;
    }

    try {
      setCameraStarting(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 9 / 16 },
        },
        audio: false,
      });
      if (requestId !== cameraRequestId.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      const videoTrack = mediaStream.getVideoTracks()[0];
      let focusModes = [];
      try {
        focusModes = videoTrack?.getCapabilities?.().focusMode || [];
      } catch (capabilityError) {
        console.info('Camera focus controls are not available.', capabilityError);
      }
      if (focusModes?.includes('continuous')) {
        try {
          await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
        } catch (focusError) {
          console.info('Continuous autofocus is not available for this camera.', focusError);
        }
      }
      if (requestId !== cameraRequestId.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      setStream(mediaStream);
      streamRef.current = mediaStream;
    } catch (error) {
      if (requestId !== cameraRequestId.current) return;
      const cameraMessages = {
        NotAllowedError: 'Camera permission was denied. Allow camera access in browser settings, then try again.',
        NotFoundError: 'No camera was found on this device. You can still choose a photo.',
        NotReadableError: 'The camera is busy in another app. Close it and try again.',
        SecurityError: 'Camera access was blocked because this page is not using HTTPS.',
      };
      setErrorMessage(
        cameraMessages[error.name] || "Camera couldn't open. You can still choose a photo!"
      );
    } finally {
      if (requestId === cameraRequestId.current) setCameraStarting(false);
    }
  };

  const stopCamera = () => {
    cameraRequestId.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setCameraReady(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
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
    formData.append('language', language);
    if (childProfileId && !hasChildSession()) formData.append('child_profile_id', childProfileId);

    try {
      const res = await fetch('/api/capture/upload', {
        method: 'POST',
        credentials: 'include',
        headers: childSessionHeaders(),
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error('Photo analysis request failed.', {
          status: res.status,
          code: data?.error,
          message: data?.message,
        });
        const uploadMessages = {
          FILE_TOO_LARGE: 'That picture is a little too big. Please choose a smaller one.',
          UNSUPPORTED_FORMAT: 'Please choose a JPEG, PNG, or WEBP picture.',
          NO_FILE_PROVIDED: 'Please choose a picture to explore.',
        };
        throw new Error(uploadMessages[data?.error] || PHOTO_RETRY_MESSAGE);
      }

      if (!data) {
        console.error('Photo analysis API returned an empty or invalid response.', { status: res.status });
        throw new Error(PHOTO_RETRY_MESSAGE);
      }

      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      console.error('Could not analyze photo.', err);
      const friendlyUploadMessages = [
        PHOTO_RETRY_MESSAGE,
        'That picture is a little too big. Please choose a smaller one.',
        'Please choose a JPEG, PNG, or WEBP picture.',
        'Please choose a picture to explore.',
      ];
      setErrorMessage(friendlyUploadMessages.includes(err.message) ? err.message : PHOTO_RETRY_MESSAGE);
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
        {capturedImage ? (
          <img
            src={previewUrl}
            alt="Captured item"
            className="image-preview"
          />
        ) : stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-preview"
          />
        ) : (
          <div className="camera-placeholder">
            <span aria-hidden="true">📸</span>
            <strong>Ready when you are!</strong>
            <small>Turn on your camera or choose a picture.</small>
          </div>
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
              onClick={stream ? takePhoto : startCamera}
              disabled={cameraStarting || Boolean(stream && !cameraReady)}
              title={stream ? (cameraReady ? 'Take a picture' : 'The camera is starting') : 'Turn on the camera'}
              aria-label={stream ? 'Take picture' : 'Turn on camera'}
            >
              <span className="btn-icon">📸</span>
              <span className="btn-label">
                {cameraStarting ? 'Opening...' : stream ? 'Snap!' : errorMessage ? 'Try camera again' : 'Turn on camera'}
              </span>
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
