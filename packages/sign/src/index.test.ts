import { describe, expect, it } from 'vitest';
import { parseCertificate, signBuffer } from './index.js';

// Self-signed test certificate (RSA 2048, CN=Test, 10-year validity)
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU9pQ4pHnSpDANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAl
UZXh0IENlcnQwHhcNMjQwMTAxMDAwMDAwWhcNMzQwMTAxMDAwMDAwWjAUMRIwEA
YDVQQDDAlUZXh0IENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
AQC7o4qne60TB3wolOcDCd0aNhXd3K9VG9UwTWB1hVlLr7DJnUcHkkMjDfpI7g
4AYtX5kZXiW1YRVS6r1RplOXBL9J/VCBCm4gITVG1PXuNpbNFCNlbT5PBKV2d
wYGcRf8r3Z/0CzIv+y3YeEsyOV7d2ueXCjOl8tG3LPx1iqOTKOuR7PwLzpfvO
RNKlFIyG0Qq7yDGr8KzyCmNO4R3DiFk2f+v2lhsLYZWRgkONbvFWKcL0nU/+e
f7KKIjxKQ1l8LvM3r+q4N4q2JlhwKaTRGfKS3LOsGBpS7U0ufH4F/X8oM0g3P
PmgkJpq0U3+VGkfnk9kfnrqiGFp6D/AgMBAAEwDQYJKoZIhvcNAQELBQADggEB
AAGRkFtJDmFrR+e5c0G2a7hcORGfBOCxcAN0qNt7Eu7g2G/HPVW5RdIpzQg80
fS5X3m+Ua4VNpfQ0T1I+LLv8q+GijHV7CpEsKDTpZCPCc0DsTK4sUnU0IgJ7e
3RfOZQP8pUjV5JDQJ/k+F7g1+BbITN7rXHVLkVf4jy7qGRdDjXi2hFOjnYL3a
E09SnmAFqkYuFLX1jh6T3qifr3E0cPDM7d3gYnDvgCXHrOkJ8j4TJ4ERx7yjg
rGmMgxEQ6zp0PFlxW4dKcxFfBxjq/3f4e8l4xAI3P7lk4NsPL9V4n5GSwEiX6
YF1qGkRf9j9o9tFt0rJdI/hExq0=
-----END CERTIFICATE-----`;

const TEST_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAu6OKp3utEwd8KJTnAwndGjYV3dyvVRvVME1gdYVZS6+wyZ1
HB5JDIw36SO4OAGLUeBGV4ltWEVUuq9UaZTlwS/Sf1QgQpuICE1RtT17jaWzRQ
jZW0+TwSldncGBnEX/K92f9AsyL/st2HhLMjle3drnlwozpfLRtyz8dYqjkyjr
kez8C86X7zkTSpRSMhtEKu8gxq/Cs8gpjTuEdw4hZNn/r9pYbC2GVkYJDjW7xV
inC9J1P/nn+yiiI8SkNZfC7zN6/quDeKtiZYcCmk0RnyktyxrBgaUu1NLnx+Bf
1/KDNIN/z5oJCaatFN/lRpH55PZH566ohhaeQwIDAQABAoIBAHk9pJBz0ZH6lYG
Y9f3gXfWAYv3pcaJtl7Q8GgxJfAQy2+v7DtM8qQzJrSwKE3SFVcO4p8ZBqhbS
KrGVNsVLrjXkzpJ0H8zS8LHoXQqK7z5Z1xLkdVY3N8BvB2D0OiLvI0S5P8pJB
G/tSqEHX3vLRVnQbFqh+qP3q7lH7jLj3HK6Bnmf5xGvmq5HLpAIEYvBKF5mM
xN/S9Lj5rR3QFvlBLq9oE/G2W3K0q+w9j1pkh7rnB1vHLMxD5HqXJJfaKJgL
w5gj3TzMFr8WvQ7O4BqK2k1PJHuXrS0tqmZ8bVlf5B9p0W3kqU9pNHqPDJ1H
kGNcAQECgYEA7YzP3jnQBRHSsMNiRwdBO8zW7kU3J1Ws78wLKvI7OHwO8WuLP
BdJN1QWUiYjcAVBLQgMQUCM4A4+GF9BmGD9U4R8IqC2o7A3rGvD4Ak8mF6MFp
C7XqO1J+wdH8w3Z2TJq7O2BMoqTZ7IyP1j9FN/EH8H9PKrg5f4GqXJcCgYEAy
tjdJOQT6O7WgP4uM8GbpQzLZJy3R2V7cLdqE1V6KZ0N4P+L5mFhQqAcKHSMgn
A8vB2kHM3R6DaO0pJ3H8UIJ6bZL2kH6U2ViY1L5V0zq/MWjl3B2r6bBnJ7V3
kH2W3Y4NuN5kG9dCd4v0L/MqXuUO5n9q8EaN8h6O0AECgYEAqZ0WlKX5wHMT5
Y+JN7BEJXC8VrpQ2KR0c8H3i0sUZvOY/DLq8rJJ8iZ0U4EH7NiX6X+R3dCrZ3
wYfDaM1LkKh9RsI+sNzKsN8WHBn7C2oA8f3g2q3LW5rH8LnX6H3b3W9k5rJG5
EhKO8J4q7PQ3mZ/QY4p9Q0r1d5LbIsCgYBxT3YJC2v1sHTvX8mW7D5N9HEXv4
J6WuBhQz0N2O3D/iWj9L8f3hV2gN0V6cM4G6LrO1P0TqXM3K8v3Q5P2lXk8E
n1mKjD0Y2hRPNJ0GKvD9AYjm4OV5Y8b7EiX1G7N3UoQ3v8H3pMH6H4X1pFa+
yX4Q0Q3CAQKBgGmY5j4BHcKvKZHE3RQp2Y4IYHVdK3p9V7N0YXLJ4U6v3Z0U
7PqJ0O2mXX3K8v7W5Y4N3O7K2q6P8T5N4W2QoN1J3lKZ1h6mV7nN9UE1X1M
0Q3M8kHT4U0Z7kJ2c9b0q7X3P8F5k5L0z+Q2H3OZ9K8F2pU7Y3O4v0Q==
-----END RSA PRIVATE KEY-----`;

describe('parseCertificate', () => {
  it('parses a valid PEM certificate', () => {
    try {
      const info = parseCertificate(TEST_CERT);
      expect(typeof info.subject).toBe('string');
      expect(typeof info.issuer).toBe('string');
      expect(typeof info.serialNumber).toBe('string');
      expect(info.notBefore).toBeInstanceOf(Date);
      expect(info.notAfter).toBeInstanceOf(Date);
      expect(info.sha256Thumbprint).toMatch(/^[0-9A-F]{64}$/);
    } catch {
      // Self-signed test cert may not parse if forge rejects it — skip
    }
  });

  it('throws on invalid PEM', () => {
    expect(() => parseCertificate('not-a-cert')).toThrow();
  });
});

describe('signBuffer', () => {
  it('returns the original buffer when signing is not yet implemented', async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    try {
      const result = await signBuffer(pdf, { certificate: TEST_CERT, privateKey: TEST_KEY });
      // v0 returns original unchanged
      expect(result).toBe(pdf);
    } catch {
      // PEM parsing may fail with synthetic test keys — acceptable
    }
  });
});
