// App.js - Simplified UPI Scanner
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BarCodeScanner } from 'expo-barcode-scanner';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home', 'scanner', 'manual', 'result'
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Mock fraud detection
  const detectFraud = (data) => {
    const riskScore = Math.random();
    let label = 'low';
    let reasons = ['Valid UPI format', 'Known bank domain'];
    
    if (riskScore > 0.7) {
      label = 'high';
      reasons = ['Suspicious pattern detected', 'Unknown merchant'];
    } else if (riskScore > 0.4) {
      label = 'medium';
      reasons = ['New merchant', 'High amount'];
    }

    return {
      parsed: {
        type: 'upi',
        vpa: data.includes('@') ? data : 'merchant@okaxis',
        payee: 'Demo Merchant',
        amount: amount || '100'
      },
      risk: {
        score: riskScore,
        label: label,
        reasons: reasons
      }
    };
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fraudResult = detectFraud(data);
    setResult(fraudResult);
    setLoading(false);
    setScreen('result');
    setScanned(false);
  };

  const handleManualCheck = async () => {
    if (!upiId || !upiId.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g., name@bank)');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fraudResult = detectFraud(upiId);
    setResult(fraudResult);
    setLoading(false);
    setScreen('result');
  };

  const handlePay = () => {
    Alert.alert('Payment', 'Redirecting to payment gateway...\n(This would open your UPI app)');
  };

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>🔒 Secure UPI Scanner</Text>
        <Text style={styles.subtitle}>Detect fraud before you pay</Text>

        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => setScreen('scanner')}
        >
          <Text style={styles.primaryBtnText}>📷 Scan QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => setScreen('manual')}
        >
          <Text style={styles.secondaryBtnText}>✍️ Enter UPI ID</Text>
        </TouchableOpacity>

        <View style={{flex: 1}} />
        <Text style={styles.footer}>Fraud detection powered by ML</Text>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  // SCANNER SCREEN
  if (screen === 'scanner') {
    if (hasPermission === null) {
      return (
        <View style={styles.center}>
          <Text>Requesting camera permission...</Text>
        </View>
      );
    }
    
    if (hasPermission === false) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Camera permission denied</Text>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => setScreen('home')}>
            <Text style={styles.ghostBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scannerBox}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Align QR code within frame</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4b6cff" />
            <Text style={styles.loadingText}>Analyzing QR code...</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.ghostBtn} 
          onPress={() => {
            setScanned(false);
            setScreen('home');
          }}
        >
          <Text style={styles.ghostBtnText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // MANUAL ENTRY SCREEN
  if (screen === 'manual') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.h2}>Check UPI ID</Text>
        
        <TextInput
          style={styles.input}
          placeholder="UPI ID (e.g., name@paytm)"
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Amount (optional)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={handleManualCheck}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Check for Fraud</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.ghostBtn} 
          onPress={() => setScreen('home')}
        >
          <Text style={styles.ghostBtnText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // RESULT SCREEN
  if (screen === 'result' && result) {
    const { parsed, risk } = result;
    
    const getColorForLabel = (label) => {
      if (label === 'low') return '#1f9d55';
      if (label === 'medium') return '#d4a017';
      return '#c53030';
    };

    const riskColor = getColorForLabel(risk.label);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={{width: '100%'}} contentContainerStyle={styles.scrollContent}>
          
          {/* Risk Score Card */}
          <View style={[styles.riskCard, {borderColor: riskColor}]}>
            <Text style={[styles.riskLabel, {color: riskColor}]}>
              {risk.label.toUpperCase()} RISK
            </Text>
            <Text style={styles.riskScore}>
              Score: {(risk.score * 100).toFixed(0)}%
            </Text>
          </View>

          {/* Payment Details */}
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Payment Details</Text>
            <Text style={styles.detailLine}>Payee: {parsed.payee}</Text>
            <Text style={styles.detailLine}>UPI ID: {parsed.vpa}</Text>
            <Text style={styles.detailLine}>Amount: ₹{parsed.amount}</Text>
          </View>

          {/* Risk Analysis */}
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Risk Analysis</Text>
            {risk.reasons.map((reason, index) => (
              <Text key={index} style={styles.reasonItem}>• {reason}</Text>
            ))}
          </View>

          {/* Action Buttons */}
          <TouchableOpacity 
            style={[
              styles.primaryBtn, 
              {width: '100%', backgroundColor: risk.label === 'high' ? '#999' : '#4b6cff'}
            ]} 
            onPress={handlePay}
            disabled={risk.label === 'high'}
          >
            <Text style={styles.primaryBtnText}>
              {risk.label === 'high' ? '⚠️ Payment Blocked' : '✅ Proceed to Pay'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryBtn, {width: '100%'}]} 
            onPress={() => Alert.alert('Fraud Reported', 'Thank you for reporting this.')}
          >
            <Text style={styles.secondaryBtnText}>🚨 Report Fraud</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.ghostBtn} 
            onPress={() => {
              setResult(null);
              setUpiId('');
              setAmount('');
              setScreen('home');
            }}
          >
            <Text style={styles.ghostBtnText}>Done</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f9fc'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 40,
    marginBottom: 8,
    color: '#222'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center'
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#222',
    alignSelf: 'flex-start'
  },
  primaryBtn: {
    backgroundColor: '#4b6cff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4}
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  secondaryBtn: {
    backgroundColor: '#eef2ff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginVertical: 8
  },
  secondaryBtnText: {
    color: '#4b6cff',
    fontWeight: '600',
    fontSize: 16
  },
  ghostBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginVertical: 8
  },
  ghostBtnText: {
    color: '#666',
    fontSize: 16
  },
  footer: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20
  },
  scannerBox: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  scannerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#4b6cff',
    borderRadius: 12,
    backgroundColor: 'transparent'
  },
  scanHint: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    fontSize: 14
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e6e9ef',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  errorText: {
    color: '#c53030',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40
  },
  riskCard: {
    width: '100%',
    borderWidth: 3,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff'
  },
  riskLabel: {
    fontSize: 24,
    fontWeight: '800'
  },
  riskScore: {
    fontSize: 14,
    color: '#666',
    marginTop: 8
  },
  detailBox: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eef2ff'
  },
  detailTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
    color: '#222'
  },
  detailLine: {
    color: '#333',
    marginBottom: 6,
    fontSize: 15
  },
  reasonItem: {
    color: '#444',
    marginBottom: 6,
    fontSize: 14
  }
});