import ImageUploadCard from './ImageUploadCard';

export default function StampUploader({ value, onChange }) {
  return (
    <ImageUploadCard
      label="School Stamp / Seal"
      value={value}
      type="stamp"
      onChange={onChange}
    />
  );
}
