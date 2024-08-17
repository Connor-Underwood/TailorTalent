import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

export const FileUploadOrPaste = ({isFileUpload, getRootProps, getInputProps, file, resumeText, handleResumeTextChange}) => {
    return isFileUpload ? (
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="upload-icon" />
          <p>Click to upload or drag and drop</p>
          <p className="file-info">Only *.pdf and *.tex files will be accepted (MAX. 800x400px)</p>
          {file && <p className="file-name">{file.name}</p>}
        </div>
      ) : (
        <textarea
          value={resumeText}
          onChange={handleResumeTextChange}
          placeholder="Paste your resume here..."
          className="resume-text-area"
        />
    )
}