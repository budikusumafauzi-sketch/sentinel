import { DeviceScannerService } from '../src/services/deviceScanner';
import { apiClient } from '../src/api/client';

jest.mock('../src/api/client', () => ({
  apiClient: {
    getToken: jest.fn(),
    getDevices: jest.fn(),
    registerDevice: jest.fn(),
    createScan: jest.fn(),
    syncScanEvidence: jest.fn(),
  },
}));

describe('DeviceScannerService — Phase 4 Device Intelligence', () => {
  let scanner: DeviceScannerService;

  beforeEach(() => {
    jest.clearAllMocks();
    scanner = new DeviceScannerService();
  });

  it('should run device scan and produce normalized evidence with provenance', async () => {
    const progressUpdates: any[] = [];
    const result = await scanner.runScan((prog) => {
      progressUpdates.push(prog);
    }, false);

    expect(progressUpdates.length).toBeGreaterThanOrEqual(4);
    expect(result.deviceInfo).toBeDefined();
    expect(result.deviceInfo.manufacturer).toBeDefined();
    expect(result.deviceInfo.model).toBeDefined();
    expect(result.deviceInfo.osVersion).toBeDefined();

    expect(result.rawEvidence.length).toBeGreaterThan(0);

    // Check data trust provenance
    const osEvidence = result.rawEvidence.find((e) => e.checkId === 'os.version');
    expect(osEvidence).toBeDefined();
    expect(osEvidence?.source).toBeDefined();

    // Check explicit permission required handling
    const wifiEvidence = result.rawEvidence.find((e) => e.checkId === 'network.wifi_ssid');
    expect(wifiEvidence).toBeDefined();
    expect(wifiEvidence?.trustState).toBe('PERMISSION_REQUIRED');
    expect(wifiEvidence?.capabilityStatus).toBe('PERMISSION_REQUIRED');

    // Check explicit unable to verify handling
    const hsmEvidence = result.rawEvidence.find((e) => e.checkId === 'system.hardware_attestation');
    expect(hsmEvidence).toBeDefined();
    expect(hsmEvidence?.trustState).toBe('UNABLE_TO_VERIFY');

    // Check capabilities matrix
    expect(result.capabilities['device_metadata']).toBe('SUPPORTED');
    expect(result.capabilities['os_version']).toBe('SUPPORTED');
    expect(result.capabilities['application_discovery']).toBe('PARTIALLY_SUPPORTED');
  });

  it('should synchronize evidence with backend when authenticated', async () => {
    (apiClient.getToken as jest.Mock).mockReturnValue('mock-jwt-token');
    (apiClient.getDevices as jest.Mock).mockResolvedValue({ data: [] });
    (apiClient.registerDevice as jest.Mock).mockResolvedValue({
      data: { id: 'device-uuid-123' },
    });
    (apiClient.createScan as jest.Mock).mockResolvedValue({
      data: { id: 'scan-uuid-456' },
    });
    (apiClient.syncScanEvidence as jest.Mock).mockResolvedValue({
      data: { id: 'scan-uuid-456', status: 'COMPLETED' },
    });

    const result = await scanner.runScan(undefined, true);

    expect(result.deviceId).toBe('device-uuid-123');
    expect(apiClient.registerDevice).toHaveBeenCalled();
    expect(apiClient.createScan).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'device-uuid-123', type: 'FULL' }),
    );
    expect(apiClient.syncScanEvidence).toHaveBeenCalledWith(
      'scan-uuid-456',
      expect.objectContaining({
        rawEvidence: expect.any(Array),
        capabilities: expect.any(Object),
      }),
    );
  });

  it('should complete scan gracefully even if backend sync fails', async () => {
    (apiClient.getToken as jest.Mock).mockReturnValue('mock-jwt-token');
    (apiClient.getDevices as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await scanner.runScan(undefined, true);

    expect(result).toBeDefined();
    expect(result.rawEvidence.length).toBeGreaterThan(0);
  });
});
