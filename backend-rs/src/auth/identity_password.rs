use base64::Engine;
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use sha1::Sha1;
use sha2::{Sha256, Sha512};
use subtle::ConstantTimeEq;

#[derive(Debug, Clone, Copy)]
pub enum Prf {
    HmacSha1 = 0,
    HmacSha256 = 1,
    HmacSha512 = 2,
}

fn read_u32_be(bytes: &[u8], offset: usize) -> Option<u32> {
    let b = bytes.get(offset..offset + 4)?;
    Some(u32::from_be_bytes([b[0], b[1], b[2], b[3]]))
}

pub fn verify(password: &str, hashed: &str) -> bool {
    let decoded = match base64::engine::general_purpose::STANDARD.decode(hashed.as_bytes()) {
        Ok(v) => v,
        Err(_) => return false,
    };

    if decoded.len() < 1 + 4 + 4 + 4 {
        return false;
    }
    if decoded[0] != 0x01 {
        return false;
    }

    let prf = match read_u32_be(&decoded, 1) {
        Some(0) => Prf::HmacSha1,
        Some(1) => Prf::HmacSha256,
        Some(2) => Prf::HmacSha512,
        _ => return false,
    };
    let iter_count = match read_u32_be(&decoded, 5) {
        Some(v) if v > 0 => v,
        _ => return false,
    };
    let salt_len = match read_u32_be(&decoded, 9) {
        Some(v) => v as usize,
        _ => return false,
    };

    let salt_start = 13;
    let salt_end = salt_start + salt_len;
    let salt = match decoded.get(salt_start..salt_end) {
        Some(s) => s,
        None => return false,
    };
    let expected = match decoded.get(salt_end..) {
        Some(s) if !s.is_empty() => s,
        _ => return false,
    };

    let mut actual = vec![0u8; expected.len()];
    let iter = iter_count;

    match prf {
        Prf::HmacSha1 => pbkdf2_hmac::<Sha1>(password.as_bytes(), salt, iter, &mut actual),
        Prf::HmacSha256 => pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, iter, &mut actual),
        Prf::HmacSha512 => pbkdf2_hmac::<Sha512>(password.as_bytes(), salt, iter, &mut actual),
    }

    actual.ct_eq(expected).into()
}

pub fn hash_v3(password: &str, iterations: u32) -> String {
    let prf = Prf::HmacSha256;
    let mut salt = [0u8; 16];
    let mut rng = rand::thread_rng();
    rng.fill_bytes(&mut salt);

    let mut subkey = [0u8; 32];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), &salt, iterations, &mut subkey);

    let mut payload = Vec::with_capacity(1 + 4 + 4 + 4 + salt.len() + subkey.len());
    payload.push(0x01);
    payload.extend_from_slice(&(prf as u32).to_be_bytes());
    payload.extend_from_slice(&iterations.to_be_bytes());
    payload.extend_from_slice(&(salt.len() as u32).to_be_bytes());
    payload.extend_from_slice(&salt);
    payload.extend_from_slice(&subkey);

    base64::engine::general_purpose::STANDARD.encode(payload)
}
