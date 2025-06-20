import React, { useState } from 'react';
import axios from 'axios';
import './ReportForm.css';

const ReportForm = () => {
  const [formData, setFormData] = useState({
    disasterId: new URLSearchParams(window.location.search).get('disasterId'),
    content: '',
    imageUrl: '',
    analysis: null,
    loading: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, loading: true }));

    try {
      // Upload image to backend
      const formData = new FormData();
      formData.append('image', file);
      const response = await axios.post('http://localhost:5000/api/upload-image', formData);
      
      // Get analysis
      const analysisResponse = await axios.post('http://localhost:5000/api/analyze-image', {
        imageUrl: response.data.url
      });

      setFormData(prev => ({
        ...prev,
        imageUrl: response.data.url,
        analysis: analysisResponse.data,
        loading: false
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setFormData(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormData(prev => ({ ...prev, loading: true }));

    try {
      await axios.post('http://localhost:5000/api/reports', {
        disaster_id: formData.disasterId,
        content: formData.content,
        imageUrl: formData.imageUrl,
        analysis: formData.analysis
      });

      // Redirect to disaster details
      window.location.href = `/disaster/${formData.disasterId}`;
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setFormData(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="report-form">
      <h2>Submit Disaster Report</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="content">Report Description:</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Upload Image (Optional):</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageUpload}
          />
          {formData.imageUrl && (
            <div className="image-preview">
              <img src={formData.imageUrl} alt="Preview" />
              {formData.analysis && (
                <div className="analysis-result">
                  <h4>Image Analysis:</h4>
                  <p>Confidence: {formData.analysis.score * 100}%</p>
                  <p>Status: {formData.analysis.manipulated ? 'Suspicious' : 'Genuine'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={formData.loading}>
          {formData.loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
