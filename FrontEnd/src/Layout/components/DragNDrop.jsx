import React, { useEffect, useState } from "react";
import { AiOutlineCheckCircle, AiOutlineCloudUpload } from "react-icons/ai";
import { MdClear } from "react-icons/md";
import "./drag-drop.css";

const DragNdrop = ({
  onFilesSelected,
  width = "100%",         // default width if not passed
  height = "200px"        // default height if not passed
}) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  useEffect(() => {
    onFilesSelected(file);
  }, [file, onFilesSelected]);

  return (
    <section className="drag-drop" style={{ width, height }}>
      <div
        className={`document-uploader ${file ? "active" : ""}`}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <>
          <div className="upload-info">
            <AiOutlineCloudUpload />
            <div>
              <p>Drag and drop your file here</p>
              <p>PDF only</p>
            </div>
          </div>
          <input
            type="file"
            hidden
            id="browse"
            onChange={handleFileChange}
            accept=".pdf"
          />
          <label htmlFor="browse" className="browse-btn">
            Browse file
          </label>
          <br />
        </>

        {file && (
          <div className="file-list">
            <div className="file-list__container">
              <div className="file-item">
                <div className="file-info">
                  <p>{file.name}</p>
                </div>
                <div className="file-actions">
                  <MdClear onClick={handleRemoveFile} />
                </div>
              </div>
            </div>
          </div>
        )}

        {file && (
          <div className="success-file">
            <AiOutlineCheckCircle style={{ color: "#6DC24B", marginRight: 1 }} />
            <p>1 file selected</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DragNdrop;
