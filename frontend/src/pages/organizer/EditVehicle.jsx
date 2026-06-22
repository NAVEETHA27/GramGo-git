import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import { vehiclesAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/common/Spinner';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

const VEHICLE_TYPES  = ['CAR','BIKE','SUV','TRUCK','VAN','LUXURY','ELECTRIC','SCOOTER','MINIBUS','OTHER'];

export default function EditVehicle() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const { data: vehicle, isLoading } = useQuery(
    ['vehicle-edit', id],
    () => vehiclesAPI.getById(id).then((r) => r.data.data)
  );

  const { register, handleSubmit } = useForm({
    values: vehicle ? {
      eventName:    vehicle.eventName,
      description:  vehicle.description,
      category:     vehicle.category,
      eventType:    vehicle.eventType || 'OFFLINE',
      venueName:    vehicle.venueName,
      location:     vehicle.location,
      googleMapsUrl:vehicle.googleMapsUrl,
      ticketPrice:  vehicle.ticketPrice,
      totalSeats:   vehicle.totalSeats,
      collegeName:  vehicle.collegeName,   // brand
      departmentName:vehicle.departmentName, // model
      tags:         vehicle.tags,
      status:       vehicle.status,
      visibility:   vehicle.visibility,
      hasCertificate: vehicle.hasCertificate,
      // required fields
      eventDate:    vehicle.eventDate,
      eventTime:    vehicle.eventTime,
    } : {},
  });

  const mutation = useMutation(
    (data) => vehiclesAPI.update(id, {
      ...data,
      ticketPrice: Number(data.ticketPrice),
      totalSeats:  Number(data.totalSeats),
    }),
    { onSuccess: () => { toast.success('Vehicle listing updated!'); navigate('/organizer/events'); } }
  );

  if (isLoading) return <Spinner full />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <FiArrowLeft />
        </button>
        <h1 className="section-title">Edit Vehicle Listing</h1>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-card">
          <h2 className="font-bold text-gray-900">Vehicle Details</h2>

          <Field label="Listing Title">
            <input {...register('eventName', { required: true })} className="input-field" />
          </Field>
          <Field label="Description">
            <textarea {...register('description')} rows={4} className="input-field resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Vehicle Type">
              <select {...register('category')} className="input-field">
                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Price per Day (Rs.)">
              <input {...register('ticketPrice')} type="number" min="0" className="input-field" />
            </Field>
            <Field label="Brand">
              <input {...register('collegeName')} className="input-field" placeholder="e.g. Toyota" />
            </Field>
            <Field label="Model">
              <input {...register('departmentName')} className="input-field" placeholder="e.g. Innova" />
            </Field>
            <Field label="Fleet Quantity">
              <input {...register('totalSeats')} type="number" min="1" className="input-field" />
            </Field>
            <Field label="Tags (fuel,transmission,seats)">
              <input {...register('tags')} className="input-field" placeholder="PETROL,AUTOMATIC,SEATS_5" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pickup Area">
              <input {...register('venueName')} className="input-field" />
            </Field>
            <Field label="City / Location">
              <input {...register('location')} className="input-field" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select {...register('status')} className="input-field">
                {['DRAFT','PUBLISHED','CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Visibility">
              <select {...register('visibility')} className="input-field">
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input {...register('hasCertificate')} type="checkbox" className="accent-teal-600" />
            Insurance included
          </label>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={mutation.isLoading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            <FiSave /> {mutation.isLoading ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}
