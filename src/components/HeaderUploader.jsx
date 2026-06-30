import ImageUploadCard from './ImageUploadCard';

export default function HeaderUploader({ value, onChange }) {
  return (
    <ImageUploadCard
      label="Custom Header Image (A4 Width)"
      value={value}
      type="other"
      onChange={onChange}
    />
  );
}
