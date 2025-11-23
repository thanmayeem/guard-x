import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';

const API_BASE_URL = 'https://guard-x-backend.onrender.com';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [serverHealth, setServerHealth] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const [formData, setFormData] = useState({
    amount: '',
    Date: new Date().toISOString().split('T')[0],
    Time: new Date().toTimeString().split(' ')[0],
    Transaction_Type: 'Online',
    Payment_Gateway: 'Razorpay',
    Transaction_Status: 'Completed',
    Device_OS: Platform.OS === 'ios' ? 'iOS' : 'Android',
    Merchant_Category: 'Electronics',
    Transaction_Channel: 'Mobile',
    Transaction_City: 'Mumbai',
    Transaction_State: 'MH',
    Transaction_Frequency: '',
    Transaction_Amount_Deviation: '',
  });

  const transactionTypes = ['Online', 'In-Store', 'ATM'];
  const paymentGateways = ['PayPal', 'Stripe', 'Square', 'Razorpay'];
  const deviceOS = ['Android', 'iOS', 'Windows', 'MacOS'];
  const merchantCategories = [
    'Electronics',
    'Groceries',
    'Fashion',
    'Travel',
    'Entertainment',
    'Healthcare',
  ];
  const transactionChannels = ['Mobile', 'Web', 'POS'];

  useEffect(() => {
    checkServerHealth();
  }, []);

  useEffect(() => {
    if (formData.amount && formData.Transaction_Frequency) {
      const amount = parseFloat(formData.amount);
      const frequency = parseInt(formData.Transaction_Frequency);
      
      const estimatedAvg = frequency <= 3 ? 2000 : frequency <= 10 ? 15000 : 25000;
      const deviation = Math.abs(amount - estimatedAvg);
      
      updateField('Transaction_Amount_Deviation', deviation.toFixed(0));
    }
  }, [formData.amount, formData.Transaction_Frequency]);

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setServerHealth(data);
    } catch (error) {
      console.error('Server health check failed:', error);
      setServerHealth({ status: 'offline' });
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePredict = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid transaction amount');
      return;
    }

    if (!formData.Transaction_Frequency || parseInt(formData.Transaction_Frequency) <= 0) {
      Alert.alert('Validation Error', 'Please enter your monthly transaction frequency');
      return;
    }

    setLoading(true);
    setPrediction(null);

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        Date: formData.Date,
        Time: formData.Time,
        Transaction_Type: formData.Transaction_Type,
        Payment_Gateway: formData.Payment_Gateway,
        Transaction_Status: formData.Transaction_Status,
        Device_OS: formData.Device_OS,
        Merchant_Category: formData.Merchant_Category,
        Transaction_Channel: formData.Transaction_Channel,
        Transaction_City: formData.Transaction_City,
        Transaction_State: formData.Transaction_State,
        Transaction_Frequency: parseInt(formData.Transaction_Frequency),
        Transaction_Amount_Deviation: parseFloat(formData.Transaction_Amount_Deviation) || 0,
      };

      console.log('Sending prediction request:', payload);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Prediction result:', result);
      setPrediction(result);

      Alert.alert(
        result.fraud_prediction === 1 ? '⚠️ Fraud Detected' : '✅ Legitimate Transaction',
        `Risk Level: ${result.risk_level}\nFraud Probability: ${(
          result.fraud_probability * 100
        ).toFixed(1)}%`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Prediction error:', error);
      Alert.alert(
        'Connection Error',
        'Failed to get prediction. Please check your internet connection.',
        [
          { text: 'Retry', onPress: checkServerHealth },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      Date: new Date().toISOString().split('T')[0],
      Time: new Date().toTimeString().split(' ')[0],
      Transaction_Type: 'Online',
      Payment_Gateway: 'Razorpay',
      Transaction_Status: 'Completed',
      Device_OS: Platform.OS === 'ios' ? 'iOS' : 'Android',
      Merchant_Category: 'Electronics',
      Transaction_Channel: 'Mobile',
      Transaction_City: 'Mumbai',
      Transaction_State: 'MH',
      Transaction_Frequency: '',
      Transaction_Amount_Deviation: '',
    });
    setPrediction(null);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskBgColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH': return '#fee2e2';
      case 'MEDIUM': return '#fef3c7';
      case 'LOW': return '#d1fae5';
      default: return '#f3f4f6';
    }
  };

  const getFrequencyHelper = () => {
    const freq = parseInt(formData.Transaction_Frequency);
    if (!freq) return '';
    if (freq <= 3) return '🔴 Low frequency - First time or rare user';
    if (freq <= 10) return '🟡 Normal frequency - Regular user';
    return '🟢 High frequency - Active user';
  };

  const OptionButton = ({ label, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.optionButton, selected && styles.optionButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionButtonText,
          selected && styles.optionButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🛡️</Text>
            <Text style={styles.headerTitle}>Guard-X</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  serverHealth?.status === 'healthy' ? '#10b981' : '#ef4444',
              },
            ]}
          >
            <Text style={styles.statusText}>
              ● {serverHealth?.status === 'healthy' ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Prediction Result */}
        {prediction && (
          <View
            style={[
              styles.resultCard,
              { borderLeftColor: getRiskColor(prediction.risk_level) },
            ]}
          >
            <Text style={styles.resultTitle}>
              {prediction.fraud_prediction === 1
                ? '⚠️ FRAUD DETECTED'
                : '✅ LEGITIMATE TRANSACTION'}
            </Text>
            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Risk Level:</Text>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRiskBgColor(prediction.risk_level) },
                  ]}
                >
                  <Text
                    style={[
                      styles.riskBadgeText,
                      { color: getRiskColor(prediction.risk_level) },
                    ]}
                  >
                    {prediction.risk_level}
                  </Text>
                </View>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Fraud Probability:</Text>
                <Text style={styles.resultValue}>
                  {(prediction.fraud_probability * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Transaction Amount (₹) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(value) => updateField('amount', value)}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor="#9ca3af"
            />
            {formData.amount && (
              <Text style={styles.helperText}>
                ≈ ₹{parseFloat(formData.amount).toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          {/* Transaction Frequency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Monthly Transaction Frequency <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helperText}>
              How many transactions do you typically make per month?
            </Text>
            <TextInput
              style={styles.input}
              value={formData.Transaction_Frequency}
              onChangeText={(value) => updateField('Transaction_Frequency', value)}
              keyboardType="number-pad"
              placeholder="e.g., 10"
              placeholderTextColor="#9ca3af"
            />
            {formData.Transaction_Frequency && (
              <Text style={[styles.helperText, { marginTop: 4 }]}>
                {getFrequencyHelper()}
              </Text>
            )}
          </View>

          {/* Amount Deviation */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Amount Deviation (₹)
            </Text>
            <Text style={styles.helperText}>
              Difference from your usual transaction amount
            </Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.Transaction_Amount_Deviation}
              editable={false}
              placeholder="Auto-calculated"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.helperText}>
              💡 Auto-calculated based on amount & frequency
            </Text>
          </View>

          {/* Transaction Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transaction Type</Text>
            <View style={styles.buttonGroup}>
              {transactionTypes.map((type) => (
                <OptionButton
                  key={type}
                  label={type}
                  selected={formData.Transaction_Type === type}
                  onPress={() => updateField('Transaction_Type', type)}
                />
              ))}
            </View>
          </View>

          {/* Payment Gateway */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Gateway</Text>
            <View style={styles.buttonGroup}>
              {paymentGateways.map((gateway) => (
                <OptionButton
                  key={gateway}
                  label={gateway}
                  selected={formData.Payment_Gateway === gateway}
                  onPress={() => updateField('Payment_Gateway', gateway)}
                />
              ))}
            </View>
          </View>

          {/* Device OS */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device Operating System</Text>
            <View style={styles.buttonGroup}>
              {deviceOS.map((os) => (
                <OptionButton
                  key={os}
                  label={os}
                  selected={formData.Device_OS === os}
                  onPress={() => updateField('Device_OS', os)}
                />
              ))}
            </View>
          </View>

          {/* Merchant Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Merchant Category</Text>
            <View style={styles.buttonGroup}>
              {merchantCategories.map((category) => (
                <OptionButton
                  key={category}
                  label={category}
                  selected={formData.Merchant_Category === category}
                  onPress={() => updateField('Merchant_Category', category)}
                />
              ))}
            </View>
          </View>

          {/* Transaction Channel */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transaction Channel</Text>
            <View style={styles.buttonGroup}>
              {transactionChannels.map((channel) => (
                <OptionButton
                  key={channel}
                  label={channel}
                  selected={formData.Transaction_Channel === channel}
                  onPress={() => updateField('Transaction_Channel', channel)}
                />
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.Transaction_City}
                onChangeText={(value) => updateField('Transaction_City', value)}
                placeholder="City"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.Transaction_State}
                onChangeText={(value) => updateField('Transaction_State', value)}
                placeholder="State"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetForm}
            >
              <Text style={styles.resetButtonText}>🔄 Clear Form</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.predictButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handlePredict}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.predictButtonText}>🛡️ Check Transaction</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  resultDetails: {
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  resetButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resetButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  predictButton: {
    backgroundColor: '#3b82f6',
  },
  predictButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity:'0.6'
  },
});

export default App;