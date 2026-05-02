use unicode_bidi::{BidiInfo, Level};
use icu_segmenter::options::LineBreakOptions;
use icu_segmenter::{GraphemeClusterSegmenter, LineSegmenter};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn detect_base_dir(text: &str) -> u8 {
    let bidi = BidiInfo::new(text, None);
    if bidi.paragraphs.is_empty() {
        return 0;
    }
    let para = &bidi.paragraphs[0];
    if para.level.is_rtl() { 1 } else { 0 }
}

#[wasm_bindgen]
pub fn line_break_opportunities(text: &str) -> Vec<u32> {
    let segmenter = LineSegmenter::new_auto(LineBreakOptions::default());
    segmenter
        .segment_str(text)
        .collect::<Vec<usize>>()
        .into_iter()
        .map(|i| i as u32)
        .collect()
}

#[wasm_bindgen]
pub fn grapheme_boundaries(text: &str) -> Vec<u32> {
    let segmenter = GraphemeClusterSegmenter::new();
    segmenter
        .segment_str(text)
        .collect::<Vec<usize>>()
        .into_iter()
        .map(|i| i as u32)
        .collect()
}

#[wasm_bindgen]
pub fn reorder_bidi(text: &str, base_level: u8) -> String {
    let level = if base_level == 1 {
        Some(Level::rtl())
    } else {
        Some(Level::ltr())
    };
    let bidi = BidiInfo::new(text, level);
    if bidi.paragraphs.is_empty() {
        return text.to_string();
    }
    let para = &bidi.paragraphs[0];
    let line = para.range.clone();
    bidi.reorder_line(para, line)
        .into_owned()
}
