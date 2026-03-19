// Hearth fixture: Rust semantic coverage
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct ThemeRecord {
    pub name: String,
    pub version: u32,
    pub enabled: bool,
}

pub enum LoadError {
    NotFound,
    InvalidFormat(String),
}

pub fn find_theme<'a>(
    source: &'a HashMap<String, ThemeRecord>,
    key: &str,
) -> Result<&'a ThemeRecord, LoadError> {
    source.get(key).ok_or(LoadError::NotFound)
}
