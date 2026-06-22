import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { vehiclesAPI } from '../../services/api';
import {
  FiArrowLeft, FiCheckCircle, FiImage, FiMapPin,
  FiSave, FiSettings, FiUploadCloud, FiUsers,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

const VEHICLE_TYPES = [
  'CAR', 'BIKE', 'SUV', 'TRUCK', 'VAN',
  'LUXURY', 'ELECTRIC', 'SCOOTER', 'MINIBUS', 'OTHER',
];
const FUEL_TYPES    = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'];
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'];

export default function AddVehicle() {
  const navigate     = useNavigate();
  const [photoFile, setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status:       'DRAFT',
      visibility:   'PUBLIC',
      eventType:    'OFFLINE',
      hasCertificate: false,
    },
  });

  const photoName = useMemo(() => photoFile?.name ?? 'Upload vehicle photo', [photoFile]);

  const mutation = useMutation(
    async (formData) => {
      // Map vehicle fields to backend event fields:
      // eventName         → vehicle name/title
      // category          → vehicle type (CAR, BIKE, SUV…)
      // collegeName       → brand
      // departmentName    → model
      // ticketPrice       → price per day
      // totalSeats        → fleet quantity
      // location          → pickup location
      // venueName         → pickup address
      // tags              → fuel,transmission,seats (comma-separated)
      // hasCertificate    → insurance included
      // description       → vehicle description
      const { brand, model, fuelType, transmission, seats, ...rest } = formData;
      const tagParts = [
        fuelType ? fuelType.toUpperCase() : '',
        transmission ? transmission.toUpperCase() : '',
        seats ? `SEATS_${seats}` : '',
      ].filter(Boolean);

      const payload = {
        ...rest,
        collegeName:    brand,
        departmentName: model,
        tags:           tagParts.join(','),
        ticketPrice:    Number(rest.ticketPrice),
        totalSeats:     Number(rest.totalSeats),
        hasCertificate: Boolean(rest.hasCertificate),
        // Required backend fields with sensible defaults
        eventDate: new Date().toISOString().slice(0, 10),
        eventTime: '00:00',
      };

      const created  = await vehiclesAPI.create(payload);
      const vehicleId = created.data?.data?.id ?? created.data?.id;

      if (photoFile && vehicleId) {
        const upload = new FormData();
        upload.append('file', photoFile);
        await vehiclesAPI.uploadPhoto(vehicleId, upload);
      }
      return created;
    },
    {
      onSuccess: () => {
        toast.success(photoFile ? 'Vehicle submitted for admin approval and photo uploaded!' : 'Vehicle submitted for admin approval!');
        navigate('/organizer/events');
      },
    }
  );

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-100">
              <FiArrowLeft />
            </button>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Fleet Owner Workspace</p>
              <h1 className="section-title">List a Vehicle</h1>
            </div>
          </div>
          <button type="submit" form="add-vehicle-form" disabled={mutation.isLoading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            <FiSave /> {mutation.isLoading ? 'Listing...' : 'List Vehicle'}
          </button>
        </div>

        <form id="add-vehicle-form" onSubmit={handleSubmit((data) => mutation.mutate(data))} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="space-y-6">

            {/* Basic Info */}
            <Section icon={<FiSettings />} title="Vehicle Information" text="Provide clear details so renters can make an informed choice.">
              <FormField label="Listing Title" error={errors.eventName?.message}>
                <input {...register('eventName', { required: 'Title is required' })} className="input-field" placeholder="e.g. Toyota Innova Crysta 2023" />
              </FormField>

              <FormField label="Description">
                <textarea {...register('description')} rows={4} className="input-field resize-none" placeholder="Describe the vehicle condition, features, rental terms, and any included amenities." />
              </FormField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Vehicle Type" error={errors.category?.message}>
                  <select {...register('category', { required: 'Vehicle type is required' })} className="input-field">
                    <option value="">Select type</option>
                    {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Vehicle Number" error={errors.vehicleNumber?.message}>
                  <input {...register('vehicleNumber', { required: 'Vehicle number is required' })} className="input-field" placeholder="e.g. TN 09 AB 1234" />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Aadhaar Number" error={errors.aadhaarNumber?.message}>
                  <input {...register('aadhaarNumber', {
                    required: 'Aadhaar number is required',
                    pattern: { value: /^\d{12}$/, message: 'Enter a 12 digit Aadhaar number' },
                  })} className="input-field" inputMode="numeric" maxLength={12} placeholder="12 digit Aadhaar number" />
                </FormField>
                <FormField label="Licence Number" error={errors.licenceNumber?.message}>
                  <input {...register('licenceNumber', { required: 'Licence number is required' })} className="input-field" placeholder="e.g. TN0120260001234" />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Brand" error={errors.brand?.message}>
                  <input {...register('brand', { required: 'Brand is required' })} className="input-field" placeholder="e.g. Toyota, Honda, Royal Enfield" />
                </FormField>
                <FormField label="Model" error={errors.model?.message}>
                  <input {...register('model', { required: 'Model is required' })} className="input-field" placeholder="e.g. Innova Crysta, City, Meteor 350" />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Fuel Type">
                  <select {...register('fuelType')} className="input-field">
                    <option value="">Select fuel</option>
                    {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </FormField>
                <FormField label="Transmission">
                  <select {...register('transmission')} className="input-field">
                    <option value="">Select</option>
                    {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Seating Capacity">
                  <input {...register('seats')} type="number" min="1" max="50" className="input-field" placeholder="e.g. 5" />
                </FormField>
              </div>
            </Section>

            {/* Pickup Location */}
            <Section icon={<FiMapPin />} title="Pickup Location" text="Where renters can pick up the vehicle.">
              <FormField label="Pickup Address / Area" error={errors.venueName?.message}>
                <input {...register('venueName')} className="input-field" placeholder="e.g. Anna Nagar, Chennai" />
              </FormField>
              <FormField label="City / Full Location" error={errors.location?.message}>
                <input {...register('location', { required: 'Pickup location is required' })} className="input-field" placeholder="e.g. Chennai, Tamil Nadu" />
              </FormField>
              <FormField label="Google Maps URL">
                <input {...register('googleMapsUrl')} type="url" className="input-field" placeholder="https://maps.google.com/..." />
              </FormField>
            </Section>
          </div>

          {/* Right column */}
          <aside className="space-y-6">

            {/* Photo upload */}
            <Section icon={<FiImage />} title="Vehicle Photo" text="Upload a clear photo of the vehicle.">
              <label className="poster-drop">
                {photoPreview ? (
                  <img src={photoPreview} alt="Vehicle preview" />
                ) : (
                  <div className="grid place-items-center gap-3 text-center">
                    <FiUploadCloud className="h-9 w-9 text-teal-600" />
                    <span>{photoName}</span>
                    <small>PNG, JPG, or WebP works best</small>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={onPhotoChange} />
              </label>
              {photoPreview && (
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }} className="btn-outline w-full">
                  Remove Photo
                </button>
              )}
            </Section>

            {/* Pricing & Fleet */}
            <Section icon={<FiUsers />} title="Pricing & Fleet Size" text="Set daily rate and number of units.">
              <FormField label="Price per Day (Rs.)" error={errors.ticketPrice?.message}>
                <input {...register('ticketPrice', { required: 'Price is required', min: 0 })} type="number" min="0" step="1" className="input-field" placeholder="e.g. 1500" />
              </FormField>
              <FormField label="Fleet Quantity (units)" error={errors.totalSeats?.message}>
                <input {...register('totalSeats', { required: 'Quantity is required', min: 1 })} type="number" min="1" className="input-field" placeholder="e.g. 3" />
              </FormField>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
                <input {...register('hasCertificate')} type="checkbox" className="accent-teal-600" />
                Insurance included
              </label>
            </Section>

            {/* Publish */}
            <Section icon={<FiCheckCircle />} title="Approval Settings" text="Vehicles are submitted to admin before they become visible.">
              <FormField label="Status">
                <select {...register('status')} className="input-field">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Publish Now</option>
                </select>
              </FormField>
              <FormField label="Visibility">
                <select {...register('visibility')} className="input-field">
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </FormField>
              <div className="flex gap-3">
                <button type="submit" disabled={mutation.isLoading} className="btn-primary flex-1 disabled:opacity-60">
                  {mutation.isLoading ? 'Listing...' : 'List Vehicle'}
                </button>
                <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">Cancel</button>
              </div>
            </Section>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Section({ icon, title, text, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">{icon}</div>
        <div>
          <h2 className="font-bold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{text}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
