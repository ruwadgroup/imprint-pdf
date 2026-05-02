use taffy::prelude::*;
use wasm_bindgen::prelude::*;
use js_sys::{Function, Object, Reflect, BigInt as JsBigInt};

fn get_f32(obj: &JsValue, key: &str) -> Option<f32> {
    let k = JsValue::from_str(key);
    let v = Reflect::get(obj, &k).ok()?;
    if v.is_undefined() || v.is_null() {
        return None;
    }
    v.as_f64().map(|n| n as f32)
}

fn get_str(obj: &JsValue, key: &str) -> Option<String> {
    let k = JsValue::from_str(key);
    let v = Reflect::get(obj, &k).ok()?;
    if v.is_undefined() || v.is_null() {
        return None;
    }
    v.as_string()
}

fn get_dimension(obj: &JsValue, key: &str) -> Dimension {
    let k = JsValue::from_str(key);
    let v = match Reflect::get(obj, &k) {
        Ok(v) => v,
        Err(_) => return Dimension::Auto,
    };
    if v.is_undefined() || v.is_null() {
        return Dimension::Auto;
    }
    if let Some(s) = v.as_string() {
        if s == "auto" {
            return Dimension::Auto;
        }
        if s.ends_with('%') {
            if let Ok(n) = s.trim_end_matches('%').parse::<f32>() {
                return Dimension::Percent(n / 100.0);
            }
        }
        if let Ok(n) = s.parse::<f32>() {
            return Dimension::Length(n);
        }
        return Dimension::Auto;
    }
    if let Some(n) = v.as_f64() {
        return Dimension::Length(n as f32);
    }
    Dimension::Auto
}

fn get_available_space_dimension(obj: &JsValue, key: &str) -> AvailableSpace {
    let k = JsValue::from_str(key);
    let v = match Reflect::get(obj, &k) {
        Ok(v) => v,
        Err(_) => return AvailableSpace::MaxContent,
    };
    if v.is_undefined() || v.is_null() {
        return AvailableSpace::MaxContent;
    }
    if let Some(s) = v.as_string() {
        if s == "min-content" {
            return AvailableSpace::MinContent;
        }
        if s == "max-content" {
            return AvailableSpace::MaxContent;
        }
    }
    if let Some(n) = v.as_f64() {
        return AvailableSpace::Definite(n as f32);
    }
    AvailableSpace::MaxContent
}

fn get_margin_dim(obj: &JsValue, key: &str) -> LengthPercentageAuto {
    let k = JsValue::from_str(key);
    let v = match Reflect::get(obj, &k) {
        Ok(v) => v,
        Err(_) => return LengthPercentageAuto::Length(0.0),
    };
    if v.is_undefined() || v.is_null() {
        return LengthPercentageAuto::Length(0.0);
    }
    if let Some(s) = v.as_string() {
        if s == "auto" {
            return LengthPercentageAuto::Auto;
        }
        if s.ends_with('%') {
            if let Ok(n) = s.trim_end_matches('%').parse::<f32>() {
                return LengthPercentageAuto::Percent(n / 100.0);
            }
        }
        if let Ok(n) = s.parse::<f32>() {
            return LengthPercentageAuto::Length(n);
        }
        return LengthPercentageAuto::Length(0.0);
    }
    if let Some(n) = v.as_f64() {
        return LengthPercentageAuto::Length(n as f32);
    }
    LengthPercentageAuto::Length(0.0)
}

fn get_inset_dim(obj: &JsValue, key: &str) -> LengthPercentageAuto {
    get_margin_dim(obj, key)
}

fn parse_grid_template(s: &str) -> Vec<TrackSizingFunction> {
    let s = s.trim();
    let mut result = Vec::new();

    if s.starts_with("repeat(") && s.ends_with(')') {
        let inner = &s[7..s.len() - 1];
        let comma = inner.find(',').unwrap_or(0);
        let count_str = inner[..comma].trim();
        let track_str = inner[comma + 1..].trim();
        let track = parse_single_track(track_str);
        if let Ok(count) = count_str.parse::<usize>() {
            for _ in 0..count {
                result.push(track.clone());
            }
        }
        return result;
    }

    for part in s.split_whitespace() {
        result.push(parse_single_track(part));
    }

    result
}

fn parse_single_track(s: &str) -> TrackSizingFunction {
    if s == "auto" {
        return TrackSizingFunction::Single(NonRepeatedTrackSizingFunction {
            min: MinTrackSizingFunction::Auto,
            max: MaxTrackSizingFunction::Auto,
        });
    }
    if s == "min-content" {
        return TrackSizingFunction::Single(NonRepeatedTrackSizingFunction {
            min: MinTrackSizingFunction::MinContent,
            max: MaxTrackSizingFunction::MinContent,
        });
    }
    if s == "max-content" {
        return TrackSizingFunction::Single(NonRepeatedTrackSizingFunction {
            min: MinTrackSizingFunction::MaxContent,
            max: MaxTrackSizingFunction::MaxContent,
        });
    }
    if s.ends_with("fr") {
        if let Ok(n) = s.trim_end_matches("fr").parse::<f32>() {
            return TrackSizingFunction::Single(NonRepeatedTrackSizingFunction {
                min: MinTrackSizingFunction::Auto,
                max: MaxTrackSizingFunction::Fraction(n),
            });
        }
    }
    if s.ends_with('%') {
        if let Ok(n) = s.trim_end_matches('%').parse::<f32>() {
            return TrackSizingFunction::Single(NonRepeatedTrackSizingFunction {
                min: MinTrackSizingFunction::Fixed(LengthPercentage::Percent(n / 100.0)),
                max: MaxTrackSizingFunction::Fixed(LengthPercentage::Percent(n / 100.0)),
            });
        }
    }
    if s.ends_with("px") {
        if let Ok(n) = s.trim_end_matches("px").parse::<f32>() {
            return TrackSizingFunction::Single(NonRepeatedTrackSizingFunction {
                min: MinTrackSizingFunction::Fixed(LengthPercentage::Length(n)),
                max: MaxTrackSizingFunction::Fixed(LengthPercentage::Length(n)),
            });
        }
    }
    if let Ok(n) = s.parse::<f32>() {
        return TrackSizingFunction::Single(NonRepeatedTrackSizingFunction {
            min: MinTrackSizingFunction::Fixed(LengthPercentage::Length(n)),
            max: MaxTrackSizingFunction::Fixed(LengthPercentage::Length(n)),
        });
    }
    TrackSizingFunction::Single(NonRepeatedTrackSizingFunction {
        min: MinTrackSizingFunction::Auto,
        max: MaxTrackSizingFunction::Auto,
    })
}

fn parse_style(js_style: &JsValue) -> Style {
    let mut style = Style::default();

    if let Some(d) = get_str(js_style, "display") {
        style.display = match d.as_str() {
            "flex" => Display::Flex,
            "grid" => Display::Grid,
            "block" => Display::Block,
            "none" => Display::None,
            _ => Display::Flex,
        };
    }

    if let Some(p) = get_str(js_style, "position") {
        style.position = match p.as_str() {
            "absolute" => Position::Absolute,
            _ => Position::Relative,
        };
    }

    if let Some(fd) = get_str(js_style, "flexDirection") {
        style.flex_direction = match fd.as_str() {
            "row" => FlexDirection::Row,
            "column" => FlexDirection::Column,
            "row-reverse" => FlexDirection::RowReverse,
            "column-reverse" => FlexDirection::ColumnReverse,
            _ => FlexDirection::Row,
        };
    }

    if let Some(fw) = get_str(js_style, "flexWrap") {
        style.flex_wrap = match fw.as_str() {
            "no-wrap" | "nowrap" => FlexWrap::NoWrap,
            "wrap" => FlexWrap::Wrap,
            "wrap-reverse" => FlexWrap::WrapReverse,
            _ => FlexWrap::NoWrap,
        };
    }

    if let Some(ai) = get_str(js_style, "alignItems") {
        style.align_items = Some(match ai.as_str() {
            "stretch" => AlignItems::Stretch,
            "flex-start" | "start" => AlignItems::FlexStart,
            "flex-end" | "end" => AlignItems::FlexEnd,
            "center" => AlignItems::Center,
            "baseline" => AlignItems::Baseline,
            _ => AlignItems::Stretch,
        });
    }

    if let Some(jc) = get_str(js_style, "justifyContent") {
        style.justify_content = Some(match jc.as_str() {
            "flex-start" | "start" => JustifyContent::FlexStart,
            "flex-end" | "end" => JustifyContent::FlexEnd,
            "center" => JustifyContent::Center,
            "space-between" => JustifyContent::SpaceBetween,
            "space-around" => JustifyContent::SpaceAround,
            "space-evenly" => JustifyContent::SpaceEvenly,
            _ => JustifyContent::FlexStart,
        });
    }

    if let Some(fg) = get_f32(js_style, "flexGrow") {
        style.flex_grow = fg;
    }
    if let Some(fs) = get_f32(js_style, "flexShrink") {
        style.flex_shrink = fs;
    }

    style.flex_basis = get_dimension(js_style, "flexBasis");
    style.size.width = get_dimension(js_style, "width");
    style.size.height = get_dimension(js_style, "height");
    style.min_size.width = get_dimension(js_style, "minWidth");
    style.min_size.height = get_dimension(js_style, "minHeight");
    style.max_size.width = get_dimension(js_style, "maxWidth");
    style.max_size.height = get_dimension(js_style, "maxHeight");

    style.padding.top = {
        let v = get_f32(js_style, "paddingTop").unwrap_or(0.0);
        LengthPercentage::Length(v)
    };
    style.padding.right = {
        let v = get_f32(js_style, "paddingRight").unwrap_or(0.0);
        LengthPercentage::Length(v)
    };
    style.padding.bottom = {
        let v = get_f32(js_style, "paddingBottom").unwrap_or(0.0);
        LengthPercentage::Length(v)
    };
    style.padding.left = {
        let v = get_f32(js_style, "paddingLeft").unwrap_or(0.0);
        LengthPercentage::Length(v)
    };

    style.margin.top = get_margin_dim(js_style, "marginTop");
    style.margin.right = get_margin_dim(js_style, "marginRight");
    style.margin.bottom = get_margin_dim(js_style, "marginBottom");
    style.margin.left = get_margin_dim(js_style, "marginLeft");

    if let Some(gr) = get_f32(js_style, "gapRow") {
        style.gap.height = LengthPercentage::Length(gr);
    }
    if let Some(gc) = get_f32(js_style, "gapColumn") {
        style.gap.width = LengthPercentage::Length(gc);
    }

    style.inset.top = get_inset_dim(js_style, "insetTop");
    style.inset.right = get_inset_dim(js_style, "insetRight");
    style.inset.bottom = get_inset_dim(js_style, "insetBottom");
    style.inset.left = get_inset_dim(js_style, "insetLeft");

    if let Some(gtc) = get_str(js_style, "gridTemplateColumns") {
        style.grid_template_columns = parse_grid_template(&gtc);
    }
    if let Some(gtr) = get_str(js_style, "gridTemplateRows") {
        style.grid_template_rows = parse_grid_template(&gtr);
    }

    style
}

fn node_id_to_js(node: NodeId) -> JsValue {
    let raw: u64 = node.into();
    JsBigInt::from(raw).into()
}

fn js_to_node_id(val: u64) -> NodeId {
    NodeId::from(val)
}

#[derive(Default)]
pub struct NodeContext {
    pub data: JsValue,
}

#[wasm_bindgen]
pub struct TaffyEngine {
    tree: TaffyTree<NodeContext>,
}

#[wasm_bindgen]
impl TaffyEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TaffyEngine {
        TaffyEngine {
            tree: TaffyTree::new(),
        }
    }

    #[wasm_bindgen(js_name = newLeaf)]
    pub fn new_leaf(&mut self, style: JsValue) -> JsValue {
        let s = parse_style(&style);
        let node = self.tree.new_leaf(s).unwrap();
        node_id_to_js(node)
    }

    #[wasm_bindgen(js_name = newLeafWithContext)]
    pub fn new_leaf_with_context(&mut self, style: JsValue, context: JsValue) -> JsValue {
        let s = parse_style(&style);
        let ctx = NodeContext { data: context };
        let node = self.tree.new_leaf_with_context(s, ctx).unwrap();
        node_id_to_js(node)
    }

    #[wasm_bindgen(js_name = newWithChildren)]
    pub fn new_with_children(&mut self, style: JsValue, children: Vec<u64>) -> JsValue {
        let s = parse_style(&style);
        let child_ids: Vec<NodeId> = children.iter().map(|&c| js_to_node_id(c)).collect();
        let node = self.tree.new_with_children(s, &child_ids).unwrap();
        node_id_to_js(node)
    }

    #[wasm_bindgen(js_name = computeLayout)]
    pub fn compute_layout(&mut self, root: u64, available_width: f32, available_height: f32) {
        let node = js_to_node_id(root);
        let space = Size {
            width: AvailableSpace::Definite(available_width),
            height: AvailableSpace::Definite(available_height),
        };
        self.tree.compute_layout(node, space).unwrap();
    }

    #[wasm_bindgen(js_name = computeLayoutWithMeasure)]
    pub fn compute_layout_with_measure(
        &mut self,
        root: u64,
        available_width: f32,
        available_height: f32,
        measure_fn: &Function,
    ) {
        let node = js_to_node_id(root);
        let space = Size {
            width: AvailableSpace::Definite(available_width),
            height: AvailableSpace::Definite(available_height),
        };
        let measure_fn = measure_fn.clone();
        self.tree
            .compute_layout_with_measure(node, space, |known_dims, available_space, node_id, ctx, _style| {
                let known_w = known_dims.width.map(|v| JsValue::from_f64(v as f64)).unwrap_or(JsValue::NULL);
                let known_h = known_dims.height.map(|v| JsValue::from_f64(v as f64)).unwrap_or(JsValue::NULL);
                let avail_w = match available_space.width {
                    AvailableSpace::Definite(v) => JsValue::from_f64(v as f64),
                    _ => JsValue::from_f64(f32::INFINITY as f64),
                };
                let avail_h = match available_space.height {
                    AvailableSpace::Definite(v) => JsValue::from_f64(v as f64),
                    _ => JsValue::from_f64(f32::INFINITY as f64),
                };
                let raw_id: u64 = node_id.into();
                let node_id_js: JsValue = JsBigInt::from(raw_id).into();
                let context_js = ctx.map(|c| c.data.clone()).unwrap_or(JsValue::UNDEFINED);

                let result = measure_fn
                    .call6(
                        &JsValue::NULL,
                        &known_w,
                        &known_h,
                        &avail_w,
                        &avail_h,
                        &node_id_js,
                        &context_js,
                    )
                    .unwrap_or(JsValue::NULL);

                let width = Reflect::get(&result, &JsValue::from_str("width"))
                    .ok()
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.0) as f32;
                let height = Reflect::get(&result, &JsValue::from_str("height"))
                    .ok()
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.0) as f32;

                Size { width, height }
            })
            .unwrap();
    }

    #[wasm_bindgen(js_name = getLayout)]
    pub fn get_layout(&self, node: u64) -> JsValue {
        let id = js_to_node_id(node);
        let layout = self.tree.layout(id).unwrap();
        let obj = Object::new();
        let set = |k: &str, v: f64| {
            Reflect::set(&obj, &JsValue::from_str(k), &JsValue::from_f64(v)).unwrap();
        };
        set("x", layout.location.x as f64);
        set("y", layout.location.y as f64);
        set("width", layout.size.width as f64);
        set("height", layout.size.height as f64);
        set("paddingTop", layout.padding.top as f64);
        set("paddingRight", layout.padding.right as f64);
        set("paddingBottom", layout.padding.bottom as f64);
        set("paddingLeft", layout.padding.left as f64);
        set("contentWidth", layout.content_size.width as f64);
        set("contentHeight", layout.content_size.height as f64);
        obj.into()
    }

    #[wasm_bindgen(js_name = freeNode)]
    pub fn free_node(&mut self, node: u64) {
        let id = js_to_node_id(node);
        self.tree.remove(id).unwrap();
    }

    pub fn clear(&mut self) {
        self.tree.clear();
    }
}
