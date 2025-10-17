import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';
import { UserIcon } from './icons/UserIcon';

interface UserProfileModalProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

const profileToFormData = (profile: UserProfile) => ({
    height: String(profile.height),
    weight: String(profile.weight),
    chest: String(profile.chest),
    waist: String(profile.waist),
    hips: String(profile.hips),
    userImage: profile.userImage,
});

const UserProfileModal: React.FC<UserProfileModalProps> = ({ profile, onSave, onClose }) => {
  const [formData, setFormData] = useState(profileToFormData(profile));
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setFormData(profileToFormData(profile));
  }, [profile]);

  // Combined Escape key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCameraOpen) {
          handleCloseCamera();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isCameraOpen]);

  // Effect to handle camera setup and streaming
  useEffect(() => {
    if (!isCameraOpen) {
        // Ensure stream is stopped when modal is closed
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        return;
    }

    const startStream = async (deviceId?: string) => {
        // Stop any previous stream
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        setIsLoadingCamera(true);
        setCameraError(null);

        const constraints: MediaStreamConstraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: 1280 },
                height: { ideal: 720 },
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error starting stream:", err);
            setCameraError("Failed to start the selected camera. It might be in use or disconnected.");
            setIsLoadingCamera(false);
        }
    };

    const setupCamera = async () => {
        setCameraError(null);
        setIsLoadingCamera(true);

        try {
            // Get permission first to ensure we can enumerate devices with labels
            await navigator.mediaDevices.getUserMedia({ video: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            
            if (videoInputs.length === 0) {
                throw new Error("No camera was found on your device.");
            }

            setVideoDevices(videoInputs);
            const initialDeviceId = videoInputs[0]?.deviceId;
            setSelectedDeviceId(initialDeviceId);
            await startStream(initialDeviceId);

        } catch (err) {
            console.error("Error setting up camera:", err);
            let message = "Could not access camera. Please check browser permissions.";
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                message = 'Camera permission denied. Please allow access in your browser settings.';
            } else if (err instanceof Error) {
                message = err.message;
            }
            setCameraError(message);
            setIsLoadingCamera(false);
        }
    };

    setupCamera();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isCameraOpen]);
  
  const handleCameraChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.target.value;
    setSelectedDeviceId(deviceId);

    // Restart the stream with the new device
    setIsLoadingCamera(true);
    setCameraError(null);
    const constraints: MediaStreamConstraints = { video: { deviceId: { exact: deviceId } } };
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
            // Stop old stream before assigning new one
            if (videoRef.current.srcObject) {
              (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        setCameraError("Failed to switch camera.");
        setIsLoadingCamera(false);
    }
  };
  
  const handleCloseCamera = () => {
    setIsCameraOpen(false);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setFormData(prev => ({ ...prev, userImage: dataUrl }));
      }
      handleCloseCamera();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^[0-9]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, userImage: reader.result as string }));
      };
      reader.onerror = () => {
        alert("Sorry, there was an error uploading that file.");
      }
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      height: Number(formData.height) || 0,
      weight: Number(formData.weight) || 0,
      chest: Number(formData.chest) || 0,
      waist: Number(formData.waist) || 0,
      hips: Number(formData.hips) || 0,
      userImage: formData.userImage,
    });
    onClose();
  };
  
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      if (isCameraOpen) handleCloseCamera();
      else onClose();
    }
  };

  const renderImageUpload = () => (
    <div className="col-span-1 flex flex-col items-center">
        <div className="relative w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center overflow-hidden flex-shrink-0">
            {formData.userImage ? (
                <img src={formData.userImage} alt="User" className="w-full h-full object-cover" />
            ) : (
                <UserIcon className="w-16 h-16 text-gray-400" />
            )}
        </div>
         <p className="text-sm text-gray-500 text-center mb-4">For the best results, use a full-body photo against a plain background.</p>
        <div className="flex gap-4">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
               <UploadIcon className="w-5 h-5"/> Upload Photo
            </button>
            <button 
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              <CameraIcon className="w-5 h-5"/> Use Camera
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/png, image/jpeg"
                className="hidden"
            />
        </div>
    </div>
  );
  
  const renderCameraView = () => (
      <div className="col-span-1 flex flex-col items-center">
          <div className="w-full aspect-[3/4] rounded-lg bg-black mb-4 overflow-hidden relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
                onPlaying={() => setIsLoadingCamera(false)}
              ></video>
              {isLoadingCamera && <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50">Starting camera...</div>}
          </div>
          {videoDevices.length > 1 && (
            <div className="w-full mb-4">
              <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1">Select Camera</label>
              <select
                  id="camera-select"
                  value={selectedDeviceId}
                  onChange={handleCameraChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                  {videoDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                      </option>
                  ))}
              </select>
            </div>
          )}
          <div className="flex gap-4">
            <button onClick={handleCloseCamera} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Back</button>
            <button onClick={handleCapture} disabled={isLoadingCamera || !!cameraError} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Capture</button>
          </div>
          {cameraError && <p className="text-red-500 text-sm mt-2 text-center">{cameraError}</p>}
          <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <header className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">{isCameraOpen ? "Capture Your Photo" : "My Profile"}</h2>
          <button onClick={isCameraOpen ? handleCloseCamera : onClose} className="p-1 rounded-full hover:bg-gray-200">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6">
            {isCameraOpen ? renderCameraView() : renderImageUpload()}
            
            {!isCameraOpen && (
              <>
                <hr />
                <h3 className="font-semibold text-center text-gray-600">Your Measurements</h3>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input type="text" pattern="\d*" name="height" id="height" value={formData.height} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input type="text" pattern="\d*" name="weight" id="weight" value={formData.weight} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="chest" className="block text-sm font-medium text-gray-700">Chest (cm)</label>
                        <input type="text" pattern="\d*" name="chest" id="chest" value={formData.chest} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="waist" className="block text-sm font-medium text-gray-700">Waist (cm)</label>
                        <input type="text" pattern="\d*" name="waist" id="waist" value={formData.waist} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="hips" className="block text-sm font-medium text-gray-700">Hips (cm)</label>
                        <input type="text" pattern="\d*" name="hips" id="hips" value={formData.hips} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
              </>
            )}
          </div>
        </main>
        {!isCameraOpen && (
          <footer className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-4 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">
              Save Changes
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;