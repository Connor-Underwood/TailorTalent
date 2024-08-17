export const ToggleSwitch = ({isFileUpload, setIsFileUpload}) => {
    return <div className="toggle-container">
    <span>Upload</span>
    <label className="switch">
      <input
        type="checkbox"
        checked={!isFileUpload}
        onChange={() => setIsFileUpload(!isFileUpload)}
      />
      <span className="slider round"></span>
    </label>
    <span>Paste Resume</span>
  </div>
}