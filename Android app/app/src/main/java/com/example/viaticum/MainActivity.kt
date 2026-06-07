package com.example.viaticum

import androidx.activity.compose.BackHandler
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.UriHandler
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.example.viaticum.ui.theme.ViaticumTheme
import coil.compose.AsyncImage
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.Scope
import com.google.android.gms.tasks.Task
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.sheets.v4.Sheets
import com.google.api.services.sheets.v4.model.ValueRange
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

// =========================================================================
// --- QUARTER 1: SETUP & MODELS & SCHEMAS ---
// =========================================================================

data class TravelEntry(
    val date: Date, val event: String, val location: String, val status: String,
    val schedule: String, val details: String, val links: String, val tripName: String = "", val rowIndex: Int = -1
)

data class TemplateEntry(val target: String, val name: String, val text: String)

data class RefData(
    val statuses: Map<String, String> = emptyMap(), val locations: Map<String, String> = emptyMap(),
    val events: Map<String, String> = emptyMap(), val locationImages: Map<String, String> = emptyMap(),
    val eventImages: Map<String, String> = emptyMap(), val schedules: Map<String, String> = emptyMap(),
    val buttons: Map<String, String> = emptyMap(), val templates: List<TemplateEntry> = emptyList(),
    val colorsLight: Map<String, String> = emptyMap(), val colorsDark: Map<String, String> = emptyMap()
)

fun getSheetsService(context: Context, account: GoogleSignInAccount): Sheets {
    val credential = GoogleAccountCredential.usingOAuth2(context, listOf("https://www.googleapis.com/auth/spreadsheets"))
    credential.selectedAccount = account.account
    return Sheets.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance(), credential).setApplicationName("Viaticum").build()
}

fun getCell(row: List<Any>, index: Int): String = if (index < row.size) row[index].toString().trim() else ""


fun String.normalizeStr(): String {
    var str = this.lowercase().trim()

    // FIX: proper German normalization
    str = str
        .replace("ö", "oe")
        .replace("ä", "ae")
        .replace("ü", "ue")
        .replace("ß", "ss")

    val normalized = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD)

    return normalized
        .replace("\\p{Mn}+".toRegex(), "")
        .replace("[^a-z0-9]".toRegex(), "")
}



fun getThemeColor(uiElement: String, refData: RefData, isDark: Boolean, fallback: Color): Color {
    val hex = (if (isDark) refData.colorsDark[uiElement] else refData.colorsLight[uiElement])?.trim()
    return try { if (!hex.isNullOrEmpty()) Color(android.graphics.Color.parseColor(hex)) else fallback } catch (_: Exception) { fallback }
}

@Composable
fun ScrollableColumnWithBar(modifier: Modifier = Modifier, scrollState: ScrollState, indicatorColor: Color, content: @Composable ColumnScope.() -> Unit) {
    Box(modifier = modifier) {
        // Added 12.dp end padding to ensure scrollbar doesn't overlap inner content boxes
        Column(modifier = Modifier.fillMaxSize().padding(end = 12.dp).verticalScroll(scrollState), content = content)
        val density = LocalDensity.current
        var heightPx by remember { mutableIntStateOf(0) }
        Box(modifier = Modifier.fillMaxHeight().align(Alignment.TopEnd).onGloballyPositioned { heightPx = it.size.height }) {
            if (scrollState.maxValue > 0 && heightPx > 0) {
                val viewportHeight = with(density) { heightPx.toDp() }
                val contentHeight = viewportHeight + with(density) { scrollState.maxValue.toDp() }
                val indicatorHeight = (viewportHeight * (viewportHeight / contentHeight)).coerceAtLeast(20.dp)
                val scrollProportion = scrollState.value.toFloat() / scrollState.maxValue.toFloat()

                val indicatorOffset = (scrollProportion * (viewportHeight.value - indicatorHeight.value)).dp
                Box(modifier = Modifier.offset(y = indicatorOffset).height(indicatorHeight).width(4.dp).padding(end = 2.dp).clip(RoundedCornerShape(2.dp)).background(indicatorColor))
            }
        }
    }
}

@Composable
fun ScrollableLazyColumnWithBar(modifier: Modifier = Modifier, listState: LazyListState, indicatorColor: Color, contentPadding: PaddingValues = PaddingValues(0.dp), scrollbarOnLeft: Boolean = false, content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit) {
    Box(modifier = modifier) {
        val listModifier = Modifier.fillMaxSize().padding(
            start = if (scrollbarOnLeft) 12.dp else 0.dp,
            end = if (!scrollbarOnLeft) 12.dp else 0.dp
        )
        LazyColumn(state = listState, modifier = listModifier, contentPadding = contentPadding, content = content)
        val layoutInfo = listState.layoutInfo
        val totalItems = layoutInfo.totalItemsCount
        val visibleItems = layoutInfo.visibleItemsInfo.size
        if (totalItems > 0 && visibleItems < totalItems) {
            var heightPx by remember { mutableIntStateOf(0) }
            val density = LocalDensity.current
            val indicatorAlignment = if (scrollbarOnLeft) Alignment.TopStart else Alignment.TopEnd
            val indicatorPadding = if (scrollbarOnLeft) PaddingValues(start = 2.dp) else PaddingValues(end = 2.dp)

            Box(modifier = Modifier.fillMaxHeight().align(indicatorAlignment).onGloballyPositioned { heightPx = it.size.height }) {

                if (heightPx > 0) {
                    val viewportHeight = with(density) { heightPx.toDp() }
                    val indicatorHeight = (viewportHeight * (visibleItems.toFloat() / totalItems)).coerceAtLeast(20.dp)
                    val firstVisible = listState.firstVisibleItemIndex
                    val scrollProportion = firstVisible.toFloat() / (totalItems - visibleItems).coerceAtLeast(1).toFloat()
                    val indicatorOffset = (scrollProportion * (viewportHeight.value - indicatorHeight.value)).dp

                    Box(
                        modifier = Modifier
                            .offset(y = indicatorOffset)
                            .height(indicatorHeight)
                            .width(4.dp)
                            .padding(indicatorPadding)
                            .clip(RoundedCornerShape(2.dp))
                            .background(indicatorColor)
                    )
                }

            }
        }
    }
}


class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        setContent {
            ViaticumTheme {
                MainAuthScreen()
            }
        }
    }
}

@Composable
fun MainAuthScreen() {
    val context = LocalContext.current
    val gso: GoogleSignInOptions = remember { GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).requestEmail().requestScopes(Scope("https://www.googleapis.com/auth/spreadsheets")).build() }
    val googleSignInClient = remember { GoogleSignIn.getClient(context, gso) }
    var account: GoogleSignInAccount? by remember { mutableStateOf(GoogleSignIn.getLastSignedInAccount(context)) }
    val launcher = rememberLauncherForActivityResult(contract = ActivityResultContracts.StartActivityForResult()) { result ->
        try { account = GoogleSignIn.getSignedInAccountFromIntent(result.data).getResult(ApiException::class.java) } catch (e: Exception) { e.printStackTrace() }
    }
    val hasPermissions: Boolean = account != null && GoogleSignIn.hasPermissions(account, Scope("https://www.googleapis.com/auth/spreadsheets"))

    if (!hasPermissions || account == null) {
        Box(modifier = Modifier.fillMaxSize().background(Color.White), contentAlignment = Alignment.Center) {
            Button(onClick = { launcher.launch(googleSignInClient.signInIntent) }) { Text("Sign in with Google") }
        }
    } else {
        AppScreen(account = account!!, onSignOut = { googleSignInClient.signOut().addOnCompleteListener { account = null } })
    }
}

// =========================================================================
// --- QUARTER 2: DAY SCREEN & EDIT SCREEN ---
// =========================================================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DayScreen(
    date: Date, entries: List<TravelEntry>, refData: RefData, isDarkMode: Boolean, onClose: () -> Unit, onEdit: () -> Unit,
    onClear: () -> Unit, onDateChange: (Date) -> Unit, onOpenSheet: () -> Unit, onSync: () -> Unit, onOpenMore: () -> Unit, onOpenTrip: () -> Unit,
    isPreviewMode: Boolean = false, onCancelPreview: () -> Unit = {}
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    val uriHandler = LocalUriHandler.current
    val entry = entries.find { it.date == date }

    val bgMain = getThemeColor("Bg_Main", refData, isDarkMode, if (isDarkMode) Color(0xFF121212) else Color.White)
    val textMainColor = getThemeColor("Text_Main", refData, isDarkMode, if (isDarkMode) Color.White else Color.Black)
    val navColor = getThemeColor("Bar_BottomNav", refData, isDarkMode, if (isDarkMode) Color(0xFF121212) else Color(0xFFF5F5F5))
    val accentColor = getThemeColor("Btn_Save", refData, isDarkMode, Color(0xFF2196F3))
    val defaultCardBg = if (isDarkMode) Color(0xFF1E1E1E) else Color.White

    val headerDayBg = getThemeColor("Header_Day_Bg", refData, isDarkMode, accentColor)
    val headerDayText = getThemeColor("Header_Day_Text", refData, isDarkMode, Color.White)

    val schedBg = getThemeColor("Day_Sched_Bg", refData, isDarkMode, if (isDarkMode) Color(0xFF3A3315) else Color(0xFFFFF9C4))
    val schedBord = getThemeColor("Day_Sched_Border", refData, isDarkMode, Color(0xFFFFA500))
    val detailBg = getThemeColor("Day_Detail_Bg", refData, isDarkMode, defaultCardBg)
    val detailBord = getThemeColor("Day_Detail_Border", refData, isDarkMode, accentColor.copy(alpha = 0.3f))
    val filesBg = getThemeColor("Day_Files_Bg", refData, isDarkMode, defaultCardBg)
    val filesBord = getThemeColor("Day_Files_Border", refData, isDarkMode, accentColor.copy(alpha = 0.5f))
    val scrollIndicatorColor = getThemeColor("Border_Scroll", refData, isDarkMode, accentColor)

    val navItemColors = NavigationBarItemDefaults.colors(indicatorColor = navColor, selectedIconColor = textMainColor, selectedTextColor = textMainColor, unselectedIconColor = textMainColor, unselectedTextColor = textMainColor)

    val df = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.getDefault())
    val displayDate = df.format(date)
    var accumulatedDrag by remember { mutableFloatStateOf(0f) }
    var showDatePicker by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState(initialSelectedDateMillis = date.time)

    var expandAll by remember { mutableStateOf(true) }
    var schedExpanded by rememberSaveable { mutableStateOf(true) }
    var detailsExpanded by rememberSaveable { mutableStateOf(true) }
    var linksExpanded by rememberSaveable { mutableStateOf(true) }

    LaunchedEffect(expandAll) { schedExpanded = expandAll; detailsExpanded = expandAll; linksExpanded = expandAll }

    val shareDay = {
        if (entry != null) {
            val shareText = "Itinerary for ${displayDate}:\nLocation: ${entry.location}\nEvent: ${entry.event}\n\nSchedule:\n${entry.schedule}"
            val sendIntent = Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, shareText) }
            context.startActivity(Intent.createChooser(sendIntent, "Share Itinerary"))
        }
    }

    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val selectedUtc = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply { timeInMillis = millis }
                        val localDate = Calendar.getInstance().apply { clear(); set(selectedUtc.get(Calendar.YEAR), selectedUtc.get(Calendar.MONTH), selectedUtc.get(Calendar.DAY_OF_MONTH)) }.time
                        onDateChange(localDate)
                    }
                    showDatePicker = false
                }) { Text("Go") }
            }
        ) { DatePicker(state = datePickerState) }
    }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = navColor) {
                if (isPreviewMode) {
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Cancel_Edit"] ?: "❌", fontSize = 24.sp, color = Color.Red) }, label = { Text(refData.buttons["Banner_PrevCancel"] ?: "Cancel Preview", color = Color.Red, fontWeight = FontWeight.Bold) }, selected = false, onClick = onCancelPreview)
                } else {
                    NavigationBarItem(icon = { Text("🏠", fontSize = 24.sp) }, label = { Text("Home", color = textMainColor) }, selected = true, onClick = onClose, colors = navItemColors)
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Trip"] ?: "🧳", fontSize = 24.sp) }, label = { Text("Trip", color = textMainColor) }, selected = false, onClick = onOpenTrip, colors = navItemColors)
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Sheet"] ?: "🔗", fontSize = 24.sp) }, label = { Text("Sheet", color = textMainColor) }, selected = false, onClick = onOpenSheet, colors = navItemColors)
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Sync"] ?: "🔄", fontSize = 24.sp) }, label = { Text("Sync", color = textMainColor) }, selected = false, onClick = onSync, colors = navItemColors)
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_More"] ?: "🍔", fontSize = 24.sp) }, label = { Text("More", color = textMainColor) }, selected = false, onClick = onOpenMore, colors = navItemColors)
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier.fillMaxSize().background(bgMain).padding(paddingValues).pointerInput(Unit) {
                detectHorizontalDragGestures(onDragEnd = { accumulatedDrag = 0f }) { change, dragAmount ->
                    change.consume(); accumulatedDrag += dragAmount
                    if (accumulatedDrag > 150f) { onDateChange(Calendar.getInstance().apply { time = date; add(Calendar.DAY_OF_YEAR, -1) }.time); accumulatedDrag = 0f }
                    else if (accumulatedDrag < -150f) { onDateChange(Calendar.getInstance().apply { time = date; add(Calendar.DAY_OF_YEAR, 1) }.time); accumulatedDrag = 0f }
                }
            }
        ) {
            Box(modifier = Modifier.fillMaxWidth().zIndex(1f)) {
                Box(modifier = Modifier.fillMaxWidth().background(bgMain).padding(top = 16.dp, start = 16.dp, end = 16.dp)) {
                    Column {
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(headerDayBg).clickable { showDatePicker = true }.padding(16.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                                Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(displayDate, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = headerDayText)
                                        Spacer(Modifier.width(8.dp)); Text("▾", fontSize = 18.sp, color = headerDayText)
                                    }
                                    if (entry != null) {
                                        if (entry.location.isNotBlank()) {
                                            Spacer(Modifier.height(12.dp))
                                            val locEmoji = refData.locations[entry.location] ?: "📍"
                                            Text("$locEmoji ${entry.location}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = headerDayText)
                                        }
                                        if (entry.status.isNotBlank()) {
                                            Spacer(Modifier.height(12.dp))
                                            Row {
                                                entry.status.split(",").forEachIndexed { index, s ->
                                                    val statName = s.trim()
                                                    if (statName.isNotEmpty()) {
                                                        if (index > 0) Spacer(Modifier.width(8.dp))
                                                        val statEmoji = refData.statuses[statName] ?: ""
                                                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                                                            Text(statEmoji, fontSize = 12.sp); Spacer(Modifier.width(4.dp)); Text(statName, fontWeight = FontWeight.Bold, color = headerDayText, fontSize = 11.sp)
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                if (entry != null && entry.event.isNotBlank()) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(90.dp)) {
                                        val mainEventName = entry.event.split(",").firstOrNull()?.trim() ?: ""
                                        val refImg = refData.eventImages.entries.find { it.key.normalizeStr() == mainEventName.normalizeStr() }?.value?.trim() ?: refData.eventImages.entries.find { it.key.normalizeStr() == "event" }?.value?.trim() ?: ""
                                        val finalImageUrl = when { refImg.isBlank() -> ""; refImg.startsWith("http", ignoreCase = true) -> refImg; else -> "https://raw.githubusercontent.com/cinaedvsstudios/Viaticum/main/$refImg" }

                                        if (finalImageUrl.isNotBlank()) AsyncImage(model = finalImageUrl, contentDescription = "Event Image", contentScale = ContentScale.Crop, modifier = Modifier.size(70.dp).clip(RoundedCornerShape(12.dp)).border(1.dp, Color.White.copy(alpha=0.5f), RoundedCornerShape(12.dp)))
                                        else Box(modifier = Modifier.size(70.dp).background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp)).border(1.dp, Color.White.copy(alpha=0.5f), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) { Text("🖼️", fontSize = 28.sp) }

                                        Spacer(Modifier.height(6.dp))
                                        val evtEmoji = refData.events[mainEventName] ?: "🌍"
                                        Text("$evtEmoji ${entry.event}", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = headerDayText, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                    }
                                }
                            }
                        }

                        if (entry != null && (entry.event.isNotBlank() || entry.status.isNotBlank() || entry.schedule.isNotBlank() || entry.links.isNotBlank() || entry.details.isNotBlank())) {
                            Spacer(Modifier.height(16.dp))
                            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("📅", fontSize = 22.sp, modifier = Modifier.clickable { coroutineScope.launch { scrollState.animateScrollTo(0) } }.padding(end = 12.dp))
                                    Text("ℹ️", fontSize = 22.sp, modifier = Modifier.clickable { coroutineScope.launch { scrollState.animateScrollTo(scrollState.maxValue / 2) } }.padding(end = 12.dp))
                                    Text("🗺️", fontSize = 22.sp, modifier = Modifier.clickable { coroutineScope.launch { scrollState.animateScrollTo((scrollState.maxValue * 0.75f).toInt()) } }.padding(end = 12.dp))
                                    Text("🔗", fontSize = 22.sp, modifier = Modifier.clickable { coroutineScope.launch { scrollState.animateScrollTo(scrollState.maxValue) } })
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(refData.buttons["Icon_Share_Day"] ?: "📤", fontSize = 22.sp, modifier = Modifier.clickable { shareDay() }.padding(start = 12.dp))
                                    Text(refData.buttons["Icon_Clear_Day"] ?: "🗑️", fontSize = 22.sp, modifier = Modifier.clickable { onClear(); if(!isPreviewMode) onClose() }.padding(start = 12.dp))
                                    Text(refData.buttons["Icon_Edit_Day"] ?: "✏️", fontSize = 22.sp, modifier = Modifier.clickable { onEdit() }.padding(start = 12.dp))
                                    Text(refData.buttons["Icon_ExpandAll"] ?: "↕️", fontSize = 22.sp, modifier = Modifier.clickable { expandAll = !expandAll }.padding(start = 12.dp))
                                }
                            }
                            HorizontalDivider(color = accentColor, thickness = 2.dp)
                        }
                    }
                }
            }

            if (entry != null && (entry.event.isNotBlank() || entry.status.isNotBlank() || entry.schedule.isNotBlank() || entry.links.isNotBlank() || entry.details.isNotBlank())) {
                ScrollableColumnWithBar(modifier = Modifier.weight(1f).padding(horizontal = 16.dp), scrollState = scrollState, indicatorColor = scrollIndicatorColor) {
                    Spacer(Modifier.height(16.dp))

                    if (entry.schedule.isNotBlank()) {
                        val currentCardBg = if (schedExpanded) schedBg else defaultCardBg
                        val currentBorder = if (schedExpanded) schedBord else schedBord.copy(alpha = 0.5f)
                        Box(modifier = Modifier.fillMaxWidth().border(2.dp, currentBorder, RoundedCornerShape(16.dp)).background(currentCardBg, RoundedCornerShape(16.dp)).clickable { schedExpanded = !schedExpanded }.padding(16.dp)) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("SCHEDULE", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(1f))
                                    Text("▼", fontSize = 14.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.rotate(if (schedExpanded) 180f else 0f))
                                }
                                if (schedExpanded) {
                                    Spacer(Modifier.height(16.dp))
                                    val lines = entry.schedule.split("\n").filter { it.isNotBlank() }
                                    lines.forEachIndexed { index, line ->
                                        val parts = line.split(":", limit = 2); val timeStr = if (parts.size > 1 && parts[0].trim().length <= 5) parts[0].trim() else ""
                                        val actStr = if (parts.size > 1 && parts[0].trim().length <= 5) parts[1].trim() else line.trim()
                                        var rowEmoji = ""
                                        refData.schedules.forEach { (keyword, emoji) -> if (actStr.contains(keyword, ignoreCase = true)) { rowEmoji = emoji } }

                                        Row(modifier = Modifier.fillMaxWidth().padding(bottom = if (index == lines.lastIndex) 0.dp else 12.dp), verticalAlignment = Alignment.Top) {
                                            Text(timeStr, modifier = Modifier.width(45.dp), fontWeight = FontWeight.Bold, color = textMainColor, fontSize = 14.sp)
                                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 8.dp)) {
                                                Box(modifier = Modifier.size(12.dp).background(schedBord, CircleShape).border(2.dp, currentCardBg, CircleShape))
                                                if (index != lines.lastIndex) Box(modifier = Modifier.width(2.dp).height(30.dp).background(schedBord.copy(alpha = 0.5f)))
                                            }
                                            Text(actStr, modifier = Modifier.weight(1f).padding(top = 1.dp, end = 4.dp), color = textMainColor, fontSize = 14.sp)
                                            if (rowEmoji.isNotEmpty()) Text(rowEmoji, fontSize = 20.sp, modifier = Modifier.padding(start = 4.dp))
                                        }
                                    }
                                }
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }

                    if (entry.details.isNotBlank()) {
                        val currentCardBg = if (detailsExpanded) detailBg else defaultCardBg
                        val currentBorder = if (detailsExpanded) detailBord else detailBord.copy(alpha = 0.5f)
                        Box(modifier = Modifier.fillMaxWidth().border(2.dp, currentBorder, RoundedCornerShape(16.dp)).background(currentCardBg, RoundedCornerShape(16.dp)).clickable { detailsExpanded = !detailsExpanded }.padding(16.dp)) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("DETAILS", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(1f))
                                    Text("▼", fontSize = 14.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.rotate(if (detailsExpanded) 180f else 0f))
                                }
                                if (detailsExpanded) {
                                    Spacer(Modifier.height(16.dp))
                                    DetailsWrappingGrid(entry.details, refData, isDarkMode, textMainColor, uriHandler, schedBord)
                                }
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }

                    if (entry.links.isNotBlank()) {
                        val currentCardBg = if (linksExpanded) filesBg else defaultCardBg
                        val currentBorder = if (linksExpanded) filesBord else filesBord.copy(alpha = 0.5f)
                        Box(modifier = Modifier.fillMaxWidth().border(2.dp, currentBorder, RoundedCornerShape(16.dp)).background(currentCardBg, RoundedCornerShape(16.dp)).clickable { linksExpanded = !linksExpanded }.padding(16.dp)) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("DAY FILES", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(1f))
                                    Text("▼", fontSize = 14.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.rotate(if (linksExpanded) 180f else 0f))
                                }
                                if (linksExpanded) {
                                    Spacer(Modifier.height(16.dp))
                                    LinksWrappingGrid(entry.links, refData, isDarkMode, textMainColor, uriHandler)
                                }
                            }
                        }
                        Spacer(Modifier.height(32.dp))
                    }
                }
            } else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("No events for this day.", color = textMainColor.copy(alpha = 0.5f), fontSize = 18.sp) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditScreen(
    date: Date,
    existingEntries: List<TravelEntry>,
    refData: RefData,
    tripsList: List<String>,
    isDarkMode: Boolean,
    onSaveAndNav: (TravelEntry, Date) -> Unit,
    onMove: (Date, TravelEntry) -> Unit,
    onCancel: () -> Unit
) {
    val existingEntry = existingEntries.find { it.date == date }
    val defaultStatus = refData.statuses.keys.firstOrNull() ?: "Booked"

    var location by remember { mutableStateOf("") }
    var event by remember { mutableStateOf("") }
    var status by remember { mutableStateOf(defaultStatus) }
    var schedule by remember { mutableStateOf("") }
    var details by remember { mutableStateOf("") }
    var links by remember { mutableStateOf("") }
    var tripName by remember { mutableStateOf("") }

    LaunchedEffect(date) {
        val entry = existingEntries.find { it.date == date }

        location = entry?.location ?: ""
        event = entry?.event ?: ""
        status = entry?.status?.takeIf { it.isNotBlank() } ?: defaultStatus
        schedule = entry?.schedule ?: ""
        details = entry?.details ?: ""
        links = entry?.links ?: ""
        tripName = entry?.tripName ?: ""
    }

    var showCopyDatePicker by remember { mutableStateOf(false) }
    var showMoveDatePicker by remember { mutableStateOf(false) }
    var showMoveWarning by remember { mutableStateOf(false) }
    var pendingMoveEntry by remember { mutableStateOf<TravelEntry?>(null) }
    var isPreviewMode by remember { mutableStateOf(false) }

    val datePickerState = rememberDatePickerState(initialSelectedDateMillis = date.time)
    val df = SimpleDateFormat("EEEE dd MMMM yyyy", Locale.getDefault())

    val bgColor = getThemeColor("Bg_Main", refData, isDarkMode, if (isDarkMode) Color(0xFF121212) else Color.White)
    val textMainColor = getThemeColor("Text_Main", refData, isDarkMode, if (isDarkMode) Color.White else Color.Black)
    val bottomNavColor = getThemeColor("Bar_BottomNav", refData, isDarkMode, if (isDarkMode) Color(0xFF121212) else Color(0xFFF5F5F5))
    val editDateBarColor = getThemeColor("Header_Edit_Bg", refData, isDarkMode, Color(0xFF81D4FA))
    val editDateTextColor = getThemeColor("Header_Edit_Text", refData, isDarkMode, Color.White)
    val scrollIndicatorColor = getThemeColor("Border_Scroll", refData, isDarkMode, Color(0xFF2196F3))

    val boxBgColor = getThemeColor("Bg_EditBox", refData, isDarkMode, Color.Transparent)
    val accentColor = getThemeColor("Btn_Save", refData, isDarkMode, Color(0xFF2196F3))

    if (showCopyDatePicker || showMoveDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showCopyDatePicker = false; showMoveDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val selectedUtc = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply { timeInMillis = millis }
                        val localDate = Calendar.getInstance().apply { clear(); set(selectedUtc.get(Calendar.YEAR), selectedUtc.get(Calendar.MONTH), selectedUtc.get(Calendar.DAY_OF_MONTH)) }.time
                        val entry = TravelEntry(localDate, event, location, status, schedule, details, links, tripName)

                        if (showCopyDatePicker) {
                            onSaveAndNav(entry, localDate)
                            showCopyDatePicker = false
                        } else {
                            val target = existingEntries.find { it.date == localDate }
                            if (target != null && (target.location.isNotBlank() || target.event.isNotBlank())) {
                                pendingMoveEntry = entry
                                showMoveWarning = true
                            } else {
                                onMove(date, entry)
                            }
                            showMoveDatePicker = false
                        }
                    }
                }) { Text("Confirm") }
            }
        ) { DatePicker(state = datePickerState) }
    }

    if (showMoveWarning && pendingMoveEntry != null) {
        AlertDialog(
            onDismissRequest = { showMoveWarning = false },
            title = { Text("Warning", fontWeight = FontWeight.Bold) },
            text = { Text("There is already information on this day. Overwrite?") },
            confirmButton = {
                TextButton(onClick = {
                    showMoveWarning = false
                    pendingMoveEntry?.let { onMove(date, it) }
                }) { Text("Yes, Move", color = Color.Red) }
            },
            dismissButton = { TextButton(onClick = { showMoveWarning = false }) { Text("Cancel") } }
        )
    }

    val previewEntry = remember(event, location, status, schedule, details, links, tripName) {
        TravelEntry(date, event, location, status, schedule, details, links, tripName)
    }

    Scaffold(
        bottomBar = {
            if (!isPreviewMode) {
                NavigationBar(containerColor = bottomNavColor) {
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Preview_Edit"] ?: "👁️", fontSize = 24.sp) }, label = { Text("Preview", color = textMainColor) }, selected = false, onClick = { isPreviewMode = true }, colors = NavigationBarItemDefaults.colors(indicatorColor = Color.Transparent))
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Save_Edit"] ?: "💾", fontSize = 24.sp) }, label = { Text("Save", color = textMainColor) }, selected = false, onClick = { onSaveAndNav(TravelEntry(date, event, location, status, schedule, details, links, tripName), date) }, colors = NavigationBarItemDefaults.colors(indicatorColor = Color.Transparent))
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Copy_Edit"] ?: "📋", fontSize = 24.sp) }, label = { Text("Copy", color = textMainColor) }, selected = false, onClick = { showCopyDatePicker = true }, colors = NavigationBarItemDefaults.colors(indicatorColor = Color.Transparent))
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Move_Edit"] ?: "🚚", fontSize = 24.sp) }, label = { Text("Move", color = textMainColor) }, selected = false, onClick = { showMoveDatePicker = true }, colors = NavigationBarItemDefaults.colors(indicatorColor = Color.Transparent))
                    NavigationBarItem(icon = { Text(refData.buttons["Btn_Cancel_Edit"] ?: "❌", fontSize = 24.sp) }, label = { Text("Cancel", color = textMainColor) }, selected = false, onClick = onCancel, colors = NavigationBarItemDefaults.colors(indicatorColor = Color.Transparent))
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().background(bgColor).padding(paddingValues)) {

            Box(modifier = Modifier.fillMaxWidth().zIndex(1f).padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(editDateBarColor).padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {


                    Text("◀", fontSize = 24.sp, color = editDateTextColor, modifier = Modifier.clickable {
                        val prevDate = Calendar.getInstance().apply { time = date; add(Calendar.DAY_OF_YEAR, -1) }.time
                        onSaveAndNav(TravelEntry(prevDate, event, location, status, schedule, details, links, tripName), prevDate)
                    }.padding(horizontal = 8.dp))


                    Text(df.format(date), fontWeight = FontWeight.Bold, fontSize = 18.sp, color = editDateTextColor)


                    Text("▶", fontSize = 24.sp, color = editDateTextColor, modifier = Modifier.clickable {
                        val nextDate = Calendar.getInstance().apply { time = date; add(Calendar.DAY_OF_YEAR, 1) }.time
                        onSaveAndNav(TravelEntry(nextDate, event, location, status, schedule, details, links, tripName), nextDate)
                    }.padding(horizontal = 8.dp))


                }
            }


            ScrollableColumnWithBar(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = 80.dp, start = 16.dp, end = 16.dp),
                scrollState = rememberScrollState(),
                indicatorColor = scrollIndicatorColor
            ) {


                OutlinedTextField(location, { location = it }, label = { Text("Location") }, modifier = Modifier.fillMaxWidth(0.9f).align(Alignment.CenterHorizontally))
                LazyRow(modifier = Modifier.fillMaxWidth(0.9f).padding(top = 4.dp).align(Alignment.CenterHorizontally)) {
                    items(refData.locations.keys.toList()) { loc -> Text(loc, modifier = Modifier.padding(end = 8.dp).clickable { location = loc }, fontSize = 12.sp, color = Color.Gray) }
                }
                Spacer(Modifier.height(8.dp))

                OutlinedTextField(event, { event = it }, label = { Text("Event") }, modifier = Modifier.fillMaxWidth(0.9f).align(Alignment.CenterHorizontally))
                LazyRow(modifier = Modifier.fillMaxWidth(0.9f).padding(top = 4.dp).align(Alignment.CenterHorizontally)) {
                    items(refData.events.keys.toList()) { evt -> Text(evt, modifier = Modifier.padding(end = 8.dp).clickable { event = if (event.isBlank()) evt else if (event.endsWith(", ")) event + evt else "$event, $evt" }, fontSize = 12.sp, color = Color.Gray) }
                }
                Spacer(Modifier.height(12.dp))

                refData.statuses.keys.filter { it.isNotBlank() && it.lowercase() != "info" && it.lowercase() != "maps" && it.lowercase() != "paid" && it.lowercase() != "unpaid" }.toList().chunked(6).forEach { rowStatuses ->
                    Row(modifier = Modifier.fillMaxWidth(0.9f).padding(vertical = 4.dp).align(Alignment.CenterHorizontally), horizontalArrangement = Arrangement.Center) {
                        rowStatuses.forEach { statusName ->
                            val emoji = refData.statuses[statusName] ?: ""
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 8.dp).clip(RoundedCornerShape(8.dp))

                                .clickable {
                                    if (statusName.lowercase() == "erase") {
                                        status = "" // 🔥 clears everything
                                    } else {
                                        status = if (status.isBlank()) statusName
                                        else if (status.endsWith(", ")) status + statusName
                                        else "$status, $statusName"
                                    }
                                }
                                .background(if (status.contains(statusName)) editDateBarColor else Color.Transparent).padding(6.dp)) {
                                Text(emoji, fontSize = 28.sp)
                                Text(statusName, fontSize = 10.sp, color = if (status.contains(statusName)) textMainColor else Color.Gray)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))

                OutlinedTextField(value = schedule, onValueChange = { schedule = it }, label = { Text("Schedule") }, modifier = Modifier.fillMaxWidth(0.9f).background(boxBgColor).align(Alignment.CenterHorizontally), textStyle = TextStyle(color = textMainColor), minLines = 1)
                LazyRow(modifier = Modifier.fillMaxWidth(0.9f).padding(top = 4.dp, bottom = 12.dp).align(Alignment.CenterHorizontally)) {
                    val scheduleTemplates = refData.templates.filter { it.target == "Schedule" }
                    items(scheduleTemplates.size) { i -> Text(scheduleTemplates[i].name, modifier = Modifier.padding(end = 8.dp).clickable { schedule = if(schedule.isEmpty()) scheduleTemplates[i].text else "$schedule\n${scheduleTemplates[i].text}" }, fontSize = 12.sp, color = Color.Gray) }
                }

                OutlinedTextField(value = details, onValueChange = { details = it }, label = { Text("Details") }, modifier = Modifier.fillMaxWidth(0.9f).background(boxBgColor).align(Alignment.CenterHorizontally), textStyle = TextStyle(color = textMainColor), minLines = 1)
                LazyRow(modifier = Modifier.fillMaxWidth(0.9f).padding(top = 4.dp, bottom = 12.dp).align(Alignment.CenterHorizontally)) {
                    val detailsTemplates = refData.templates.filter { it.target == "Details" }
                    items(detailsTemplates.size) { i -> Text(detailsTemplates[i].name, modifier = Modifier.padding(end = 8.dp).clickable { details = if(details.isEmpty()) detailsTemplates[i].text else "$details\n${detailsTemplates[i].text}" }, fontSize = 12.sp, color = Color.Gray) }
                }

                OutlinedTextField(value = links, onValueChange = { links = it }, label = { Text("Links") }, modifier = Modifier.fillMaxWidth(0.9f).background(boxBgColor).align(Alignment.CenterHorizontally), textStyle = TextStyle(color = textMainColor), minLines = 1)

                val calPrev = Calendar.getInstance().apply { time = date; add(Calendar.DAY_OF_YEAR, -1) }
                val calNext = Calendar.getInstance().apply { time = date; add(Calendar.DAY_OF_YEAR, 1) }
                val prevEntry = existingEntries.find { val c = Calendar.getInstance().apply { time = it.date }; c.get(Calendar.YEAR) == calPrev.get(Calendar.YEAR) && c.get(Calendar.DAY_OF_YEAR) == calPrev.get(Calendar.DAY_OF_YEAR) }
                val nextEntry = existingEntries.find { val c = Calendar.getInstance().apply { time = it.date }; c.get(Calendar.YEAR) == calNext.get(Calendar.YEAR) && c.get(Calendar.DAY_OF_YEAR) == calNext.get(Calendar.DAY_OF_YEAR) }
                val sdfShort = SimpleDateFormat("MMM dd", Locale.getDefault())

                Row(modifier = Modifier.fillMaxWidth(0.9f).padding(top = 4.dp).align(Alignment.CenterHorizontally), horizontalArrangement = Arrangement.SpaceBetween) {
                    if (prevEntry != null && prevEntry.links.isNotBlank()) Text("Copy ${sdfShort.format(calPrev.time)}", fontSize = 12.sp, color = accentColor, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { links = prevEntry.links })
                    else Spacer(Modifier.width(1.dp))
                    if (nextEntry != null && nextEntry.links.isNotBlank()) Text("Copy ${sdfShort.format(calNext.time)}", fontSize = 12.sp, color = accentColor, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { links = nextEntry.links })
                    else Spacer(Modifier.width(1.dp))
                }

                LazyRow(modifier = Modifier.fillMaxWidth(0.9f).padding(top = 4.dp, bottom = 12.dp).align(Alignment.CenterHorizontally)) {
                    val linksTemplates = refData.templates.filter { it.target == "Links" }
                    items(linksTemplates.size) { i -> Text(linksTemplates[i].name, modifier = Modifier.padding(end = 8.dp).clickable { links = if(links.isEmpty()) linksTemplates[i].text else "$links\n${linksTemplates[i].text}" }, fontSize = 12.sp, color = Color.Gray) }
                }

                OutlinedTextField(value = tripName, onValueChange = { tripName = it }, label = { Text("Trip ID") }, modifier = Modifier.fillMaxWidth(0.9f).background(boxBgColor).align(Alignment.CenterHorizontally), textStyle = TextStyle(color = textMainColor), minLines = 1)
                LazyRow(modifier = Modifier.fillMaxWidth(0.9f).padding(top = 4.dp, bottom = 8.dp).align(Alignment.CenterHorizontally)) {
                    items(tripsList) { trip -> Text(trip, modifier = Modifier.padding(end = 8.dp).clickable { tripName = trip }, fontSize = 12.sp, color = Color.Gray) }
                }

                Text("Link to adjacent day:", fontSize = 10.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.fillMaxWidth(0.9f).align(Alignment.CenterHorizontally))

                val adjacentOffsets = listOf(-3, -2, -1, 1, 2, 3)
                LazyRow(modifier = Modifier.fillMaxWidth(0.9f).padding(top = 4.dp, bottom = 32.dp).align(Alignment.CenterHorizontally)) {
                    items(adjacentOffsets) { offset ->
                        val adjDate = Calendar.getInstance().apply { time = date; add(Calendar.DAY_OF_YEAR, offset) }.time
                        val adjEntry = existingEntries.find { val cal1 = Calendar.getInstance().apply { time = it.date }; val cal2 = Calendar.getInstance().apply { time = adjDate }; cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) && cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR) }
                        val hasLink = adjEntry?.tripName?.isNotBlank() == true
                        val displayStr = "${sdfShort.format(adjDate)}${if (hasLink) " 🔗" else ""}"
                        val itemColor = if (hasLink) accentColor else Color.Gray.copy(alpha = 0.5f)
                        Text(displayStr, modifier = Modifier.padding(end = 12.dp).clickable(enabled = hasLink) { if (hasLink) { tripName = adjEntry!!.tripName } }, fontSize = 12.sp, color = itemColor, fontWeight = if (hasLink) FontWeight.Bold else FontWeight.Normal)
                    }
                }
            }
        }

        if (isPreviewMode) {
            Box(modifier = Modifier.fillMaxSize().zIndex(10f)) {
                LaunchedEffect(Unit) { delay(5000); isPreviewMode = false }
                DayScreen(date = date, entries = listOf(previewEntry), refData = refData, isDarkMode = isDarkMode, onClose = { isPreviewMode = false }, onEdit = {}, onClear = {}, onDateChange = {}, onOpenSheet = {}, onSync = {}, onOpenMore = {}, onOpenTrip = {}, isPreviewMode = true, onCancelPreview = { isPreviewMode = false })
            }
        }
    }
}

// =========================================================================
// --- QUARTER 3: TRIP SCREEN & COMPONENTS ---
// =========================================================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TripScreen(
    currentTripName: String,
    allEntries: List<TravelEntry>,
    refData: RefData,
    isDarkMode: Boolean,
    onClose: () -> Unit,
    onHeaderClick: () -> Unit,
    onDeleteTrip: (String) -> Unit,
    onShareTrip: (String) -> Unit,
    onRemoveDayFromTrip: (TravelEntry) -> Unit,
    onAddDayToTrip: (TravelEntry, String) -> Unit,
    onOpenDayView: (Date) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val uriHandler = LocalUriHandler.current

    val tripEntries = allEntries.filter { it.tripName == currentTripName }.sortedBy { it.date }
    val tripListState = rememberLazyListState()

    val firstDay = tripEntries.firstOrNull()
    val lastDay = tripEntries.lastOrNull()

    val locationTitle = firstDay?.location ?: currentTripName

    val bgMain = getThemeColor("Bg_Main", refData, isDarkMode, if (isDarkMode) Color(0xFF121212) else Color.White)
    val textMainColor = getThemeColor("Text_Main", refData, isDarkMode, if (isDarkMode) Color.White else Color.Black)
    val navColor = getThemeColor("Bar_BottomNav", refData, isDarkMode, if (isDarkMode) Color(0xFF121212) else Color(0xFFF5F5F5))
    val accentColor = getThemeColor("Btn_Save", refData, isDarkMode, Color(0xFF2196F3))
    val defaultCardBg = if (isDarkMode) Color(0xFF1E1E1E) else Color.White

    val headerTripBg = getThemeColor("Header_Trip_Bg", refData, isDarkMode, accentColor)
    val headerTripText = getThemeColor("Header_Trip_Text", refData, isDarkMode, Color.White)
    val scrollIndicatorColor = getThemeColor("Border_Scroll", refData, isDarkMode, accentColor)

    var isEditing by remember { mutableStateOf(false) }
    var expandedDays by remember { mutableStateOf(setOf<Date>()) }

    LaunchedEffect(isEditing) { if (isEditing) expandedDays = emptySet() }

    val navItemColors = NavigationBarItemDefaults.colors(indicatorColor = navColor, selectedIconColor = textMainColor, selectedTextColor = textMainColor, unselectedIconColor = textMainColor, unselectedTextColor = textMainColor)

    val mainCityName = locationTitle.split(",").firstOrNull()?.trim() ?: ""
    val refImg = refData.locationImages.entries.find { it.key.normalizeStr() == mainCityName.normalizeStr() }?.value?.trim() ?: refData.locationImages.entries.find { it.key.normalizeStr() == "location" }?.value?.trim() ?: ""
    val finalImageUrl = when { refImg.isBlank() -> ""; refImg.startsWith("http", ignoreCase = true) -> refImg; else -> "https://raw.githubusercontent.com/cinaedvsstudios/Viaticum/main/$refImg" }

    val sdfDay = SimpleDateFormat("MMM dd", Locale.getDefault())
    val sdfYear = SimpleDateFormat("yyyy", Locale.getDefault())
    val dateRangeStr = if (firstDay != null && lastDay != null) "${sdfDay.format(firstDay.date)} - ${sdfDay.format(lastDay.date)}, ${sdfYear.format(firstDay.date)}" else ""

    val firstStatusList = firstDay?.status?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() } ?: emptyList()

    val candidateEntries = remember(tripEntries, allEntries) {
        if (tripEntries.isEmpty()) return@remember emptyList()
        val minDate = tripEntries.first().date; val maxDate = tripEntries.last().date
        val offsets = listOf(-3, -2, -1, 1, 2, 3)
        val candidateDates = offsets.map { offset -> val cal = Calendar.getInstance().apply { time = if (offset < 0) minDate else maxDate }; cal.add(Calendar.DAY_OF_YEAR, offset); cal.time }
        allEntries.filter { entry -> candidateDates.any { cDate -> val c1 = Calendar.getInstance().apply { time = entry.date }; val c2 = Calendar.getInstance().apply { time = cDate }; c1.get(Calendar.YEAR) == c2.get(Calendar.YEAR) && c1.get(Calendar.DAY_OF_YEAR) == c2.get(Calendar.DAY_OF_YEAR) } && entry.tripName.isBlank() }.sortedBy { it.date }
    }

    var showAddCandidates by remember { mutableStateOf(false) }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = navColor) {
                NavigationBarItem(icon = { Text("🏠", fontSize = 24.sp) }, label = { Text("Home", color = textMainColor) }, selected = false, onClick = onClose, colors = navItemColors)
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Day"] ?: "📅", fontSize = 24.sp) }, label = { Text("Day", color = textMainColor) }, selected = false, onClick = { firstDay?.date?.let { onOpenDayView(it) } }, colors = navItemColors)
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Sheet"] ?: "🔗", fontSize = 24.sp, modifier = Modifier.alpha(0.3f)) }, label = { Text("Sheet", color = textMainColor, modifier = Modifier.alpha(0.3f)) }, selected = false, onClick = { }, colors = navItemColors)
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Sync"] ?: "🔄", fontSize = 24.sp, modifier = Modifier.alpha(0.3f)) }, label = { Text("Sync", color = textMainColor, modifier = Modifier.alpha(0.3f)) }, selected = false, onClick = { }, colors = navItemColors)
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_More"] ?: "🍔", fontSize = 24.sp, modifier = Modifier.alpha(0.3f)) }, label = { Text("More", color = textMainColor, modifier = Modifier.alpha(0.3f)) }, selected = false, onClick = { }, colors = navItemColors)
            }
        }
    ) { paddingValues ->
        Column(modifier = Modifier.fillMaxSize().background(bgMain).padding(paddingValues).padding(top = 32.dp, start = 16.dp, end = 16.dp)) {
            Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(headerTripBg).clickable { onHeaderClick() }.padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                    Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                        Text("YOUR TRIP TO", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = headerTripText.copy(alpha = 0.7f))
                        Spacer(Modifier.height(8.dp))
                        Text(locationTitle, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = headerTripText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Spacer(Modifier.height(4.dp))
                        Text(dateRangeStr, fontSize = 18.sp, fontWeight = FontWeight.Medium, color = headerTripText)
                        if (firstStatusList.isNotEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            Row {
                                firstStatusList.forEachIndexed { index, statName ->
                                    if (index > 0) Spacer(Modifier.width(8.dp))
                                    val statEmoji = refData.statuses[statName] ?: ""
                                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                                        Text(statEmoji, fontSize = 12.sp); Spacer(Modifier.width(4.dp)); Text(statName, fontWeight = FontWeight.Bold, color = headerTripText, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                    if (finalImageUrl.isNotBlank()) {
                        AsyncImage(model = finalImageUrl, contentDescription = "City Image", contentScale = ContentScale.Crop, modifier = Modifier.size(110.dp).clip(RoundedCornerShape(12.dp)).border(1.dp, Color.Gray.copy(alpha=0.5f), RoundedCornerShape(12.dp)))
                    } else {
                        Box(modifier = Modifier.size(110.dp).background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp)).border(1.dp, Color.White.copy(alpha=0.5f), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) { Text("🖼️", fontSize = 40.sp) }
                    }
                }
            }

            val allDates = tripEntries.map { it.date }.toSet()
            val allExpanded = expandedDays.size == allDates.size && allDates.isNotEmpty()

            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Text("📤", fontSize = 24.sp, modifier = Modifier.clickable { onShareTrip(currentTripName) }.padding(8.dp))
                Spacer(Modifier.width(24.dp))

                val editIconBg = if (isEditing) accentColor.copy(alpha = 0.2f) else Color.Transparent
                Box(modifier = Modifier.background(editIconBg, CircleShape).clip(CircleShape).clickable { isEditing = !isEditing; showAddCandidates = false }.padding(8.dp)) { Text(refData.buttons["Icon_Edit_Trip_Days"] ?: "✏️", fontSize = 24.sp) }
                Spacer(Modifier.width(24.dp))
                Text(refData.buttons["Icon_Delete_Trip"] ?: "🗑️", fontSize = 24.sp, color = Color.Red, modifier = Modifier.clickable { onDeleteTrip(currentTripName) }.padding(8.dp))

                Spacer(Modifier.width(24.dp))
                if (!isEditing && tripEntries.isNotEmpty()) {
                    Text(text = refData.buttons["Icon_ExpandAll"] ?: "↕️", fontSize = 24.sp, modifier = Modifier.clickable { expandedDays = if (allExpanded) emptySet() else allDates }.padding(8.dp))
                    Text(text = refData.buttons["Icon_UpArrow"] ?: "⬆️", fontSize = 24.sp, modifier = Modifier.clickable { coroutineScope.launch { val firstVisible = tripListState.firstVisibleItemIndex; val prevIndex = if (firstVisible - 1 >= 0) firstVisible - 1 else 0; tripListState.animateScrollToItem(prevIndex) } }.padding(8.dp))
                    Text(text = refData.buttons["Icon_DownArrow"] ?: "⬇️", fontSize = 24.sp, modifier = Modifier.clickable { coroutineScope.launch { val firstVisible = tripListState.firstVisibleItemIndex; val nextIndex = if (firstVisible + 1 < tripEntries.size) firstVisible + 1 else tripEntries.lastIndex; tripListState.animateScrollToItem(nextIndex) } }.padding(8.dp))
                }
            }

            Text("Itinerary", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = accentColor, modifier = Modifier.padding(bottom = 4.dp))
            HorizontalDivider(color = accentColor, thickness = 2.dp, modifier = Modifier.padding(bottom = 8.dp))

            ScrollableLazyColumnWithBar(modifier = Modifier.weight(1f), listState = tripListState, indicatorColor = scrollIndicatorColor, scrollbarOnLeft = true, contentPadding = PaddingValues(bottom = 24.dp)) {
                itemsIndexed(tripEntries) { index, dayEntry ->
                    TripDayItem(
                        entry = dayEntry, refData = refData, isDarkMode = isDarkMode, uriHandler = uriHandler, isEditing = isEditing, isExpanded = expandedDays.contains(dayEntry.date),
                        onToggleExpand = { expandedDays = if (expandedDays.contains(dayEntry.date)) expandedDays - dayEntry.date else expandedDays + dayEntry.date },
                        onRemoveDay = { onRemoveDayFromTrip(dayEntry) }, isLast = index == tripEntries.lastIndex && !isEditing
                    )
                }

                if (isEditing) {
                    item {
                        Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Spacer(Modifier.width(45.dp))
                            Column(modifier = Modifier.width(16.dp).height(30.dp), horizontalAlignment = Alignment.CenterHorizontally) { Box(modifier = Modifier.width(2.dp).weight(1f).background(accentColor.copy(alpha = 0.3f))) }
                            Spacer(Modifier.width(12.dp))
                            Box(modifier = Modifier.background(accentColor.copy(alpha = 0.1f), CircleShape).border(1.dp, accentColor, CircleShape).clickable { showAddCandidates = !showAddCandidates }.padding(horizontal = 16.dp, vertical = 8.dp)) { Text("➕ Add Day", color = accentColor, fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                        }
                    }

                    if (showAddCandidates) {
                        item {
                            Spacer(Modifier.height(12.dp))
                            if (candidateEntries.isEmpty()) {
                                Text("No adjacent unassigned days found.", color = textMainColor.copy(alpha = 0.5f), fontSize = 12.sp, modifier = Modifier.padding(start = 73.dp))
                            } else {
                                val sdfShort = SimpleDateFormat("EEE dd MMM", Locale.getDefault())
                                LazyRow(modifier = Modifier.fillMaxWidth().padding(start = 73.dp, bottom = 16.dp)) {
                                    items(candidateEntries) { cand ->
                                        Column(modifier = Modifier.padding(end = 12.dp).background(defaultCardBg, RoundedCornerShape(8.dp)).border(1.dp, accentColor.copy(alpha=0.5f), RoundedCornerShape(8.dp)).clickable { onAddDayToTrip(cand, currentTripName); showAddCandidates = false }.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(sdfShort.format(cand.date), fontWeight = FontWeight.Bold, fontSize = 12.sp, color = textMainColor)
                                            Text(cand.location, fontSize = 10.sp, color = textMainColor.copy(alpha=0.7f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TripDayItem(
    entry: TravelEntry,
    refData: RefData,
    isDarkMode: Boolean,
    uriHandler: UriHandler,
    isEditing: Boolean,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit,
    onRemoveDay: () -> Unit,
    isLast: Boolean
) {
    val sdfDay = SimpleDateFormat("E", Locale.getDefault())
    val dfDayNum = SimpleDateFormat("dd", Locale.getDefault())

    val textMainColor = getThemeColor("Text_Main", refData, isDarkMode, if (isDarkMode) Color.White else Color.Black)
    val accentColor = getThemeColor("Btn_Save", refData, isDarkMode, Color(0xFF2196F3))
    val defaultCardBg = if (isDarkMode) Color(0xFF1E1E1E) else Color.White

    val badgeBg = getThemeColor("Trip_Badge_Bg", refData, isDarkMode, accentColor)
    val closedBg = getThemeColor("Trip_Closed_Bg", refData, isDarkMode, defaultCardBg)
    val closedBord = getThemeColor("Trip_Closed_Bord", refData, isDarkMode, Color(0xFFFFA500))
    val openBg = getThemeColor("Trip_Open_Bg", refData, isDarkMode, accentColor.copy(alpha = 0.15f))
    val openBord = getThemeColor("Trip_Open_Bord", refData, isDarkMode, accentColor)

    val schedBg = getThemeColor("Trip_Sched_Bg", refData, isDarkMode, if (isDarkMode) Color(0xFF3A3315) else Color(0xFFFFF9C4))
    val schedBord = getThemeColor("Trip_Sched_Bord", refData, isDarkMode, Color(0xFFFFA500))
    val detailBg = getThemeColor("Trip_Detail_Bg", refData, isDarkMode, defaultCardBg)
    val detailBord = getThemeColor("Trip_Detail_Bord", refData, isDarkMode, accentColor.copy(alpha = 0.3f))
    val filesBg = getThemeColor("Trip_Files_Bg", refData, isDarkMode, defaultCardBg)
    val filesBord = getThemeColor("Trip_Files_Bord", refData, isDarkMode, accentColor.copy(alpha = 0.5f))

    val currentCardBg = if (isExpanded) openBg else closedBg
    val currentBorder = if (isExpanded) openBord else closedBord

    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {

        if (isEditing) {
            Column(modifier = Modifier.padding(top = 16.dp, end = 8.dp)) {
                Text("❌", fontSize = 14.sp, modifier = Modifier.clickable { onRemoveDay() })
            }
        }

        Column(modifier = Modifier.width(45.dp).padding(top = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(modifier = Modifier.background(if (isExpanded) badgeBg else Color.Transparent, RoundedCornerShape(8.dp)).padding(horizontal = 4.dp, vertical = 2.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(sdfDay.format(entry.date), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = if (isExpanded) Color.White else badgeBg)
                    Text(dfDayNum.format(entry.date), fontSize = 12.sp, color = if (isExpanded) Color.White.copy(alpha=0.8f) else textMainColor.copy(alpha = 0.7f))
                }
            }
        }

        Column(modifier = Modifier.width(16.dp).fillMaxHeight(), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(14.dp))
            Box(modifier = Modifier.size(8.dp).background(badgeBg, CircleShape))
            if (!isLast) {
                Box(modifier = Modifier.width(2.dp).weight(1f).background(badgeBg.copy(alpha = 0.3f)))
            } else {
                Spacer(Modifier.height(14.dp))
            }
        }

        Box(modifier = Modifier.weight(1f).padding(bottom = 16.dp).border(2.dp, currentBorder, RoundedCornerShape(12.dp)).background(currentCardBg, RoundedCornerShape(12.dp)).clickable { if (!isEditing) onToggleExpand() }.padding(12.dp)) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    val mainEventName = entry.event.split(",").firstOrNull()?.trim() ?: ""
                    val refImg = refData.eventImages.entries.find { it.key.normalizeStr() == mainEventName.normalizeStr() }?.value?.trim()
                        ?: refData.eventImages.entries.find { it.key.normalizeStr() == "event" }?.value?.trim()
                        ?: ""

                    val finalImageUrl = when {
                        refImg.isBlank() -> ""
                        refImg.startsWith("http", ignoreCase = true) -> refImg
                        else -> "https://raw.githubusercontent.com/cinaedvsstudios/Viaticum/main/$refImg"
                    }

                    if (finalImageUrl.isNotBlank()) {
                        AsyncImage(model = finalImageUrl, contentDescription = "Day Image", contentScale = ContentScale.Crop, modifier = Modifier.size(40.dp).clip(RoundedCornerShape(8.dp)).border(1.dp, Color.Gray.copy(alpha=0.5f), RoundedCornerShape(8.dp)))
                    } else {
                        Box(modifier = Modifier.size(40.dp).background(Color.Gray.copy(alpha = 0.2f), RoundedCornerShape(8.dp)).border(1.dp, Color.Gray.copy(alpha=0.5f), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) { Text("🖼️", fontSize = 20.sp) }
                    }

                    Spacer(Modifier.width(12.dp))
                    Text(entry.event, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = textMainColor, modifier = Modifier.weight(1f))
                    Text(text = "▼", fontSize = 16.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.rotate(if (isExpanded) 180f else 0f))
                }

                if (isExpanded) {
                    Spacer(Modifier.height(12.dp))
                    HorizontalDivider(color = textMainColor.copy(alpha = 0.1f))
                    Spacer(Modifier.height(16.dp))

                    if (entry.schedule.isNotBlank()) {
                        Box(modifier = Modifier.fillMaxWidth().border(2.dp, schedBord, RoundedCornerShape(16.dp)).background(schedBg, RoundedCornerShape(16.dp)).padding(16.dp)) {
                            Column {
                                Text("SCHEDULE", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f))
                                Spacer(Modifier.height(16.dp))

                                val lines = entry.schedule.split("\n").filter { it.isNotBlank() }
                                lines.forEachIndexed { index, line ->
                                    val parts = line.split(":", limit = 2)
                                    val timeStr = if (parts.size > 1 && parts[0].trim().length <= 5) parts[0].trim() else ""
                                    val actStr = if (parts.size > 1 && parts[0].trim().length <= 5) parts[1].trim() else line.trim()

                                    var rowEmoji = ""
                                    refData.schedules.forEach { (keyword, emoji) -> if (actStr.contains(keyword, ignoreCase = true)) { rowEmoji = emoji } }

                                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = if (index == lines.lastIndex) 0.dp else 12.dp), verticalAlignment = Alignment.Top) {
                                        Text(timeStr, modifier = Modifier.width(45.dp), fontWeight = FontWeight.Bold, color = textMainColor, fontSize = 14.sp)

                                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 8.dp)) {
                                            Box(modifier = Modifier.size(12.dp).background(schedBord, CircleShape).border(2.dp, schedBg, CircleShape))
                                            if (index != lines.lastIndex) Box(modifier = Modifier.width(2.dp).height(30.dp).background(schedBord.copy(alpha = 0.5f)))
                                        }
                                        Text(actStr, modifier = Modifier.weight(1f).padding(top = 1.dp, end = 4.dp), color = textMainColor, fontSize = 14.sp)
                                        if (rowEmoji.isNotEmpty()) Text(rowEmoji, fontSize = 20.sp, modifier = Modifier.padding(start = 4.dp))
                                    }
                                }
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }

                    if (entry.details.isNotBlank()) {
                        Box(modifier = Modifier.fillMaxWidth().border(2.dp, detailBord, RoundedCornerShape(16.dp)).background(detailBg, RoundedCornerShape(16.dp)).padding(16.dp)) {
                            Column {
                                Text("DETAILS", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f))
                                Spacer(Modifier.height(16.dp))
                                DetailsWrappingGrid(entry.details, refData, isDarkMode, textMainColor, uriHandler, schedBord)
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }

                    if (entry.links.isNotBlank()) {
                        Box(modifier = Modifier.fillMaxWidth().border(2.dp, filesBord, RoundedCornerShape(16.dp)).background(filesBg, RoundedCornerShape(16.dp)).padding(16.dp)) {
                            Column {
                                Text("DAY FILES", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f))
                                Spacer(Modifier.height(16.dp))
                                LinksWrappingGrid(entry.links, refData, isDarkMode, textMainColor, uriHandler)
                            }
                        }
                    }
                }
            }
        }
    }
}

// =========================================================================
// --- CUSTOM WRAPPING GRID LAYOUTS FOR LINKS, MAPS, MONEY ---
// =========================================================================

@Composable
fun LinksWrappingGrid(
    linksText: String,
    refData: RefData,
    isDarkMode: Boolean,
    textMainColor: Color,
    uriHandler: UriHandler
) {
    val links = linksText.split("\n").filter { it.isNotBlank() }

    links.chunked(3).forEach { linkRow ->
        Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.Start) {
            linkRow.forEachIndexed { index, linkLine ->
                val parts = linkLine.split(" - ", limit = 2)
                val name = parts[0].trim()
                val url = if (parts.size > 1) parts[1].trim() else ""

                var fileIcon = "📄"
                refData.schedules.forEach { (keyword, emoji) ->
                    if (name.contains(keyword, ignoreCase = true)) { fileIcon = emoji }
                }

                Box(
                    modifier = Modifier
                        .padding(end = if (index < 2) 6.dp else 0.dp)
                        .weight(1f)
                        .height(70.dp)
                        .background(Color.Gray.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                        .clickable { if (url.startsWith("http")) uriHandler.openUri(url) }
                        .padding(6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(fileIcon, fontSize = 20.sp)
                        Spacer(Modifier.height(2.dp))
                        Text(name, fontSize = 9.sp, color = textMainColor, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Medium)
                    }
                }
            }
            repeat(3 - linkRow.size) { Spacer(Modifier.weight(1f).padding(horizontal = 3.dp)) }
        }
    }
}

@Composable
fun DetailsWrappingGrid(
    detailsText: String,
    refData: RefData,
    isDarkMode: Boolean,
    textMainColor: Color,
    uriHandler: UriHandler,
    borderSchedule: Color
) {
    val detailLines = detailsText.split("\n").filter { it.isNotBlank() }
    val paidItems = detailLines.filter { it.startsWith("Paid:", true) }.flatMap { it.substringAfter("Paid:").split("|") }
    val unpaidItems = detailLines.filter { it.startsWith("Unpaid:", true) }.flatMap { it.substringAfter("Unpaid:").split("|") }
    val mapLines = detailLines.filter { it.startsWith("Maps:", true) }.flatMap { it.substringAfter("Maps:").split("|") }
    val otherLines = detailLines.filter { !it.startsWith("Paid:", true) && !it.startsWith("Unpaid:", true) && !it.startsWith("Maps:", true) }

    if (otherLines.isNotEmpty()) {
        otherLines.forEach { line ->
            if (line.startsWith("Info:", ignoreCase = true)) {
                val infoIcon = refData.buttons["Icon_Info"] ?: "ℹ️"
                Text("$infoIcon ${line.substringAfter("Info:").trim()}", color = textMainColor, fontSize = 13.sp, modifier = Modifier.padding(vertical = 2.dp))
            } else {
                Text(line, color = textMainColor, fontSize = 13.sp, modifier = Modifier.padding(vertical = 2.dp))
            }
        }
        if (paidItems.isNotEmpty() || unpaidItems.isNotEmpty() || mapLines.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = textMainColor.copy(alpha = 0.1f))
            Spacer(Modifier.height(12.dp))
        }
    }

    if (paidItems.isNotEmpty()) {
        Text("PAID", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.padding(bottom = 6.dp))
        val tickIcon = refData.buttons["Icon_Paid"] ?: "✅"

        paidItems.chunked(3).forEach { paidRow ->
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)) {
                paidRow.forEachIndexed { index, item ->
                    Box(modifier = Modifier.padding(end = if (index < 2) 4.dp else 0.dp).weight(1f).background(Color(0xFFE8F5E9), RoundedCornerShape(8.dp)).border(1.dp, Color(0xFF4CAF50), RoundedCornerShape(8.dp)).padding(horizontal=4.dp, vertical=4.dp), contentAlignment = Alignment.Center) {
                        Text("$tickIcon ${item.trim()}", fontSize=10.sp, color=Color(0xFF2E7D32), fontWeight=FontWeight.Medium, textAlign = TextAlign.Center, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
                repeat(3 - paidRow.size) { Spacer(Modifier.weight(1f).padding(horizontal = 2.dp)) }
            }
        }
        if (unpaidItems.isNotEmpty() || mapLines.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = textMainColor.copy(alpha = 0.1f))
            Spacer(Modifier.height(12.dp))
        }
    }

    if (unpaidItems.isNotEmpty()) {
        Text("UNPAID", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.padding(bottom = 6.dp))
        val warnIcon = refData.buttons["Icon_Unpaid"] ?: "⚠️"

        unpaidItems.chunked(3).forEach { unpaidRow ->
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)) {
                unpaidRow.forEachIndexed { index, item ->
                    Box(modifier = Modifier.padding(end = if (index < 2) 4.dp else 0.dp).weight(1f).background(Color(0xFFFFEBEE), RoundedCornerShape(8.dp)).border(1.dp, Color(0xFFF44336), RoundedCornerShape(8.dp)).padding(horizontal=4.dp, vertical=4.dp), contentAlignment = Alignment.Center) {
                        Text("$warnIcon ${item.trim()}", fontSize=10.sp, color=Color(0xFFC62828), fontWeight=FontWeight.Medium, textAlign = TextAlign.Center, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
                repeat(3 - unpaidRow.size) { Spacer(Modifier.weight(1f).padding(horizontal = 2.dp)) }
            }
        }
        if (mapLines.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = textMainColor.copy(alpha = 0.1f))
            Spacer(Modifier.height(12.dp))
        }
    }

    if (mapLines.isNotEmpty()) {
        Text("MAPS", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.padding(bottom = 6.dp))

        mapLines.chunked(3).forEach { mapRow ->
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.Start) {
                mapRow.forEachIndexed { index, mapItem ->
                    val parts = mapItem.split(",", limit = 2)
                    val mName = parts[0].trim()
                    val mUrl = if (parts.size > 1) parts[1].trim() else ""
                    val mapIcon = refData.buttons["Icon_Map"] ?: "🗺️"
                    Box(
                        modifier = Modifier
                            .padding(end = if (index < 2) 4.dp else 0.dp)
                            .weight(1f)
                            .height(70.dp)
                            .background(Color.Gray.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            .clickable { if (mUrl.startsWith("http")) uriHandler.openUri(mUrl) }
                            .padding(6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(mapIcon, fontSize = 20.sp)
                            Spacer(Modifier.height(2.dp))
                            Text(mName, fontSize = 9.sp, color = textMainColor, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Medium)
                        }
                    }
                }
                repeat(3 - mapRow.size) { Spacer(Modifier.weight(1f).padding(horizontal = 3.dp)) }
            }
        }
    }
}

// =========================================================================
// --- QUARTER 4: MAIN APP SCREEN & NAVIGATION ---
// =========================================================================

@Suppress("DEPRECATION")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppScreen(account: GoogleSignInAccount, onSignOut: () -> Unit) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val sharedPreferences = context.getSharedPreferences("viaticum_prefs", Context.MODE_PRIVATE)

    val density = LocalDensity.current
    val previewScrollState = rememberScrollState()
    val uriHandler = LocalUriHandler.current
    val spreadsheetId = "1D8CT24J65KRPubakzrOCaYgavXGTKuo_86YBMjqGcyg"
    val sheetsService = remember { getSheetsService(context, account) }

    var entries by remember { mutableStateOf<List<TravelEntry>>(emptyList()) }
    var refData by remember { mutableStateOf(RefData()) }
    var selectedDate by remember { mutableStateOf<Date?>(null) }
    var showEdit by remember { mutableStateOf(false) }
    var showDayView by remember { mutableStateOf(false) }

    var isSyncing by remember { mutableStateOf(true) }

    // Persistent Dark Mode
    var isDarkMode by remember { mutableStateOf(sharedPreferences.getBoolean("dark_mode", false)) }

    var syncTrigger by remember { mutableIntStateOf(0) }
    var currentMonthOffset by remember { mutableIntStateOf(0) }
    var showMoreMenu by remember { mutableStateOf(false) }
    var showMonthDropdown by remember { mutableStateOf(false) }

    var showTripView by remember { mutableStateOf(false) }
    var selectedTripName by remember { mutableStateOf<String?>(null) }
    var tripsList by remember { mutableStateOf<List<String>>(emptyList()) }

    BackHandler {
        when {
            showEdit -> showEdit = false
            showDayView -> showDayView = false
            showTripView -> showTripView = false
        }
    }

    var showTripSelectorDropdown by remember { mutableStateOf(false) }

    var showNewTripDatePicker by remember { mutableStateOf(false) }
    var showNewTripNamePrompt by remember { mutableStateOf(false) }
    var newTripStartDateUtc by remember { mutableStateOf<Long?>(null) }

    // Read heights from Ref Sheet or fallback to defaults
    var topHeight by remember { mutableFloatStateOf(260f) }
    var bottomHeight by remember { mutableFloatStateOf(290f) }
    var accumulatedDrag by remember { mutableFloatStateOf(0f) }

    var expandAllPreview by remember { mutableStateOf(true) }
    var previewSchedExpanded by rememberSaveable { mutableStateOf(true) }
    var previewDetailsExpanded by rememberSaveable { mutableStateOf(true) }
    var previewLinksExpanded by rememberSaveable { mutableStateOf(true) }

    var previewContentHeightPx by remember { mutableIntStateOf(0) }
    var previewViewportHeightPx by remember { mutableIntStateOf(0) }

    LaunchedEffect(expandAllPreview) {
        previewSchedExpanded = expandAllPreview
        previewDetailsExpanded = expandAllPreview
        previewLinksExpanded = expandAllPreview
    }

    LaunchedEffect(syncTrigger) {
        withContext(Dispatchers.IO) {
            try {
                isSyncing = true
                val refResponse = sheetsService.spreadsheets().values().get(spreadsheetId, "ref!A2:Q").execute()
                val refValues = refResponse.getValues() ?: emptyList()

                val sMap = mutableMapOf<String, String>()
                val lMap = mutableMapOf<String, String>()
                val eMap = mutableMapOf<String, String>()
                val locImgMap = mutableMapOf<String, String>()
                val eImgMap = mutableMapOf<String, String>()
                val schMap = mutableMapOf<String, String>()
                val bMap = mutableMapOf<String, String>()
                val tList = mutableListOf<TemplateEntry>()
                val cLight = mutableMapOf<String, String>()
                val cDark = mutableMapOf<String, String>()

                for (row in refValues) {
                    val btnId = getCell(row, 0); if (btnId.isNotEmpty()) bMap[btnId] = getCell(row, 1)
                    val sN = getCell(row, 2); if (sN.isNotEmpty()) sMap[sN] = getCell(row, 3)
                    val lN = getCell(row, 4); if (lN.isNotEmpty()) lMap[lN] = getCell(row, 5)

                    val eN = getCell(row, 6)
                    if (eN.isNotEmpty()) eMap[eN] = getCell(row, 7)

                    val imgLookupKey = getCell(row, 8); val imgUrl = getCell(row, 9)
                    if (imgLookupKey.isNotEmpty() && imgUrl.isNotEmpty()) {
                        val normalizedKey = imgLookupKey.normalizeStr()
                        eImgMap[normalizedKey] = imgUrl
                        locImgMap[normalizedKey] = imgUrl
                    }

                    val schEmoji = getCell(row, 10); if (schEmoji.isNotEmpty()) schMap[schEmoji] = getCell(row, 11)

                    val targetBoxRaw = getCell(row, 12); val templateText = getCell(row, 13)
                    if (targetBoxRaw.isNotEmpty()) {
                        val parts = targetBoxRaw.split(","); val target = parts[0].trim()
                        val name = if (parts.size > 1) parts[1].trim() else "Template"
                        tList.add(TemplateEntry(target, name, templateText))
                    }

                    val uiElem = getCell(row, 14); val lightH = getCell(row, 15); val darkH = getCell(row, 16)
                    if (uiElem.isNotEmpty()) { cLight[uiElem] = lightH; cDark[uiElem] = darkH }
                }
                refData = RefData(sMap, lMap, eMap, locImgMap, eImgMap, schMap, bMap, tList, cLight, cDark)

                // Update default heights from sheet if available
                refData.buttons["Config_Height_Cal"]?.toFloatOrNull()?.let { topHeight = it }
                refData.buttons["Config_Height_Prev"]?.toFloatOrNull()?.let { bottomHeight = it }

                val mainResponse = sheetsService.spreadsheets().values().get(spreadsheetId, "sheet1!A2:I").execute()
                val mainValues = mainResponse.getValues() ?: emptyList()
                val list = mutableListOf<TravelEntry>()
                var currentRowIndex = 2
                val dateFormats = listOf("yyyy-MM-dd", "d/M/yyyy", "dd/MM/yyyy")

                for (row in mainValues) {
                    val dateS = getCell(row, 0)
                    if (dateS.isNotEmpty()) {
                        var parsed: Date? = null
                        for (format in dateFormats) {
                            try { parsed = SimpleDateFormat(format, Locale.getDefault()).parse(dateS); break } catch(_:Exception){}
                        }
                        if (parsed != null) {
                            list.add(
                                TravelEntry(
                                    date = parsed, location = getCell(row, 2), event = getCell(row, 3), status = getCell(row, 4),
                                    schedule = getCell(row, 5), details = getCell(row, 6), links = getCell(row, 7), tripName = getCell(row, 8),
                                    rowIndex = currentRowIndex
                                )
                            )
                        }
                    }
                    currentRowIndex++
                }
                entries = list
                tripsList = list.map { it.tripName }.filter { it.isNotBlank() }.distinct()

            } catch (_: Exception) {} finally { isSyncing = false }
        }
    }

    val clearSelectedDayLogic = {
        val originalEntry = entries.find { it.date == selectedDate }
        val rowIndex = originalEntry?.rowIndex ?: -1
        if (rowIndex != -1) {
            val clearedEntry = originalEntry!!.copy(location = "", event = "", status = "", schedule = "", details = "", links = "")
            entries = entries.map { entryItem -> if (entryItem.date == selectedDate) clearedEntry else entryItem }
            coroutineScope.launch(Dispatchers.IO) {
                try {
                    isSyncing = true
                    sheetsService.spreadsheets().values().update(spreadsheetId, "sheet1!C$rowIndex:H$rowIndex", ValueRange().setValues(listOf(listOf("", "", "", "", "", "")))).setValueInputOption("USER_ENTERED").execute()
                } catch (_: Exception) {} finally { isSyncing = false }
            }
        }
    }

    val deleteTripLogic = { tripNameToDelete: String ->
        val matchedEntries = entries.filter { it.tripName == tripNameToDelete }
        if (matchedEntries.isNotEmpty()) {
            entries = entries.map { entry -> if (entry.tripName == tripNameToDelete) entry.copy(tripName = "") else entry }
            selectedTripName = null
            coroutineScope.launch(Dispatchers.IO) {
                try {
                    isSyncing = true
                    for (entry in matchedEntries) {
                        if (entry.rowIndex != -1) sheetsService.spreadsheets().values().update(spreadsheetId, "sheet1!I${entry.rowIndex}", ValueRange().setValues(listOf(listOf("")))).setValueInputOption("USER_ENTERED").execute()
                    }
                    syncTrigger++
                } catch (_: Exception) {} finally { isSyncing = false }
            }
        }
    }

    val shareTripLogic = { tripName: String ->
        val tripEntries = entries.filter { it.tripName == tripName }.sortedBy { it.date }
        if (tripEntries.isNotEmpty()) {
            val location = tripEntries.first().location
            val sdf = SimpleDateFormat("MMM dd", Locale.getDefault())
            val dateRange = "${sdf.format(tripEntries.first().date)} - ${sdf.format(tripEntries.last().date)}"
            val shareText = "Trip to $location ($dateRange)\n\n" + tripEntries.joinToString("\n\n") { dayEntry -> "${SimpleDateFormat("dd EEEE", Locale.getDefault()).format(dayEntry.date)}\nEvent: ${dayEntry.event}\nSchedule:\n${dayEntry.schedule}" }
            val sendIntent = Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, shareText) }
            context.startActivity(Intent.createChooser(sendIntent, "Share Trip Itinerary"))
        }
    }

    val shareDayLogic = {
        val entry = entries.find { it.date == selectedDate }
        if (entry != null) {
            val displayDate = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.getDefault()).format(entry.date)
            val shareText = "Itinerary for ${displayDate}:\nLocation: ${entry.location}\nEvent: ${entry.event}\n\nSchedule:\n${entry.schedule}"
            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, shareText)
            }
            context.startActivity(Intent.createChooser(sendIntent, "Share Itinerary"))
        }
    }

    if (showNewTripNamePrompt) {
        var tempTripName by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showNewTripNamePrompt = false },
            title = { Text("New Trip Name") },
            text = { OutlinedTextField(tempTripName, { tempTripName = it }, label = { Text("Trip Name") }) },
            confirmButton = {
                TextButton(onClick = {
                    if (newTripStartDateUtc != null && tempTripName.isNotBlank()) {
                        val selectedUtc = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply { timeInMillis = newTripStartDateUtc!! }
                        val localDate = Calendar.getInstance().apply { clear(); set(selectedUtc.get(Calendar.YEAR), selectedUtc.get(Calendar.MONTH), selectedUtc.get(Calendar.DAY_OF_MONTH)) }.time
                        val targetEntry = entries.find { it.date == localDate }
                        if (targetEntry != null && targetEntry.rowIndex != -1) {
                            entries = entries.map { entry -> if (entry.rowIndex == targetEntry.rowIndex) entry.copy(tripName = tempTripName) else entry }
                            selectedTripName = tempTripName
                            coroutineScope.launch(Dispatchers.IO) {
                                try {
                                    isSyncing = true
                                    sheetsService.spreadsheets().values().update(spreadsheetId, "sheet1!I${targetEntry.rowIndex}", ValueRange().setValues(listOf(listOf(tempTripName)))).setValueInputOption("USER_ENTERED").execute()
                                    syncTrigger++
                                } catch (_: Exception) {} finally { isSyncing = false }
                            }
                        }
                    }
                    showNewTripNamePrompt = false; tempTripName = ""
                }) { Text("Confirm") }
            },
            dismissButton = { TextButton(onClick = { showNewTripNamePrompt = false; tempTripName = "" }) { Text("Cancel") } }
        )
    }

    val baseCal = Calendar.getInstance().apply { add(Calendar.MONTH, currentMonthOffset) }
    val year = baseCal.get(Calendar.YEAR); val month = baseCal.get(Calendar.MONTH)
    val firstDayCal = Calendar.getInstance().apply { set(year, month, 1) }
    val offset = if (firstDayCal.get(Calendar.DAY_OF_WEEK) == 1) 6 else firstDayCal.get(Calendar.DAY_OF_WEEK) - 2

    val daysInMonth = baseCal.getActualMaximum(Calendar.DAY_OF_MONTH)
    val totalCells = offset + daysInMonth
    val trailingEmptyDays = if (totalCells % 7 == 0) 0 else 7 - (totalCells % 7)

    val prevCal = Calendar.getInstance().apply { time = baseCal.time; add(Calendar.MONTH, -1) }
    val prevMonthDays = prevCal.getActualMaximum(Calendar.DAY_OF_MONTH)

    val bgMain = getThemeColor("Bg_Main", refData, isDarkMode, if (isDarkMode) Color(0xFF121212) else Color.White)
    val textMainColor = getThemeColor("Text_Main", refData, isDarkMode, if (isDarkMode) Color.White else Color.Black)
    val navColor = getThemeColor("Bar_BottomNav", refData, isDarkMode, if (isDarkMode) Color(0xFF121212) else Color(0xFFF5F5F5))
    val headerMonthColor = getThemeColor("Header_Month_Bg", refData, isDarkMode, Color(0xFF4FC3F7))
    val headerMonthText = getThemeColor("Header_Month_Text", refData, isDarkMode, Color.White)

    val accentColor = getThemeColor("Btn_Save", refData, isDarkMode, Color(0xFF2196F3))
    val defaultCardBg = if (isDarkMode) Color(0xFF1E1E1E) else Color.White

    val paleYellow = if (isDarkMode) Color(0xFF3A3315) else Color(0xFFFFF9C4)
    val borderSchedule = getThemeColor("Border_Schedule", refData, isDarkMode, Color(0xFFFFA500))
    val headerScheduleColor = getThemeColor("Header_Sched_Bg", refData, isDarkMode, Color(0xFFFFC107))
    val headerScheduleText = getThemeColor("Header_Sched_Text", refData, isDarkMode, Color.White)

    val headerPrevBg = getThemeColor("Header_Prev_Bg", refData, isDarkMode, accentColor)
    val headerPrevText = getThemeColor("Header_Prev_Text", refData, isDarkMode, Color.White)
    val prevSchedBg = getThemeColor("Prev_Sched_Bg", refData, isDarkMode, paleYellow)
    val prevDetailBg = getThemeColor("Prev_Detail_Bg", refData, isDarkMode, defaultCardBg)
    val prevFilesBg = getThemeColor("Prev_Files_Bg", refData, isDarkMode, defaultCardBg)

    val borderDetails = getThemeColor("Border_Details", refData, isDarkMode, accentColor.copy(alpha = 0.3f))
    val borderFiles = getThemeColor("Border_Files", refData, isDarkMode, accentColor.copy(alpha = 0.5f))
    val scrollIndicatorColor = getThemeColor("Border_Scroll", refData, isDarkMode, accentColor)

    val monthEntries = entries.filter { val c = Calendar.getInstance().apply { time = it.date }; c.get(Calendar.YEAR) == year && c.get(Calendar.MONTH) == month }

    val navItemColors = NavigationBarItemDefaults.colors(indicatorColor = navColor, selectedIconColor = textMainColor, selectedTextColor = textMainColor, unselectedIconColor = textMainColor, unselectedTextColor = textMainColor)

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = navColor) {
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Day"] ?: "📅", fontSize = 24.sp) }, label = { Text("Day", color = textMainColor) }, selected = true, onClick = { if (selectedDate != null) showDayView = true }, colors = navItemColors)
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Trip"] ?: "🧳", fontSize = 24.sp) }, label = { Text("Trip", color = textMainColor) }, selected = false, onClick = { showTripView = true; if (selectedTripName == null) selectedTripName = tripsList.firstOrNull() ?: "" }, colors = navItemColors)
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Sheet"] ?: "🔗", fontSize = 24.sp) }, label = { Text("Sheet", color = textMainColor) }, selected = false, onClick = { uriHandler.openUri("https://docs.google.com/spreadsheets/d/$spreadsheetId") }, colors = navItemColors)
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_Sync"] ?: "🔄", fontSize = 24.sp) }, label = { Text("Sync", color = textMainColor) }, selected = false, onClick = { syncTrigger++ }, colors = navItemColors)
                NavigationBarItem(icon = { Text(refData.buttons["Btn_Nav_More"] ?: "🍔", fontSize = 24.sp) }, label = { Text("More", color = textMainColor) }, selected = false, onClick = { showMoreMenu = true }, colors = navItemColors)
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().background(bgMain).padding(paddingValues)) {
            Column {
                if (isSyncing) Box(modifier = Modifier.fillMaxWidth().background(getThemeColor("Banner_Sync", refData, isDarkMode, Color(0xFFFFF59D))).padding(6.dp), contentAlignment = Alignment.Center) { Text(refData.buttons["Banner_Syncing"] ?: "⏳ Syncing...", color = textMainColor) }

                Column(modifier = Modifier.height(topHeight.dp).padding(12.dp).pointerInput(Unit) { detectHorizontalDragGestures(onDragEnd = { accumulatedDrag = 0f }) { change, dragAmount -> change.consume(); accumulatedDrag += dragAmount; if (accumulatedDrag > 120f) { currentMonthOffset -= 1; accumulatedDrag = 0f } else if (accumulatedDrag < -120f) { currentMonthOffset += 1; accumulatedDrag = 0f } } }) {
                    Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(headerMonthColor).clickable { showMonthDropdown = true }.padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                        Text(SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(baseCal.time), fontWeight = FontWeight.Bold, fontSize = 20.sp, color = headerMonthText)
                        DropdownMenu(expanded = showMonthDropdown, onDismissRequest = { showMonthDropdown = false }, modifier = Modifier.background(headerMonthColor).fillMaxWidth(0.5f)) {


                            (0..11).forEach { mIdx -> DropdownMenuItem(text = { Text(SimpleDateFormat("MMMM", Locale.getDefault()).format(Calendar.getInstance().apply { set(Calendar.MONTH, mIdx) }.time), color = headerMonthText,
                                // this is the months drop down menu on main screen size
                                fontSize = 18.sp,
                                modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) }, onClick = { currentMonthOffset += (mIdx - month); showMonthDropdown = false }, modifier = Modifier.background(headerMonthColor)) }
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    Row { listOf("Mon","Tue","Wed","Thu","Fri","Sat","Sun").forEach { Text(it, modifier = Modifier.weight(1f), fontSize = 11.sp, color = textMainColor, textAlign = TextAlign.Center) } }
                    Spacer(Modifier.height(6.dp))
                    LazyVerticalGrid(columns = GridCells.Fixed(7)) {
                        items(offset) { i -> Box(modifier = Modifier.padding(1.dp).aspectRatio(1.3f).alpha(0.4f).background(getThemeColor("Cal_PrevMonth", refData, isDarkMode, Color.LightGray)), contentAlignment = Alignment.Center) { Text("${prevMonthDays - offset + i + 1}", color = textMainColor) } }
                        items(daysInMonth) { d ->
                            val date = Calendar.getInstance().apply { set(year, month, d + 1, 0, 0, 0); set(Calendar.MILLISECOND, 0) }.time

                            val today = Calendar.getInstance().apply {
                                set(Calendar.HOUR_OF_DAY, 0)
                                set(Calendar.MINUTE, 0)
                                set(Calendar.SECOND, 0)
                                set(Calendar.MILLISECOND, 0)
                            }.time

                            val isPast = date.before(today)

                            val entry = entries.find { it.date == date }; val emojis = mutableListOf<String>()
                            if (entry != null && entry.status.isNotBlank()) entry.status.split(",").forEach { s -> refData.statuses[s.trim()]?.let { emojis.add(it) } }
                            val isSelected = date == selectedDate

                            Box(modifier = Modifier.padding(1.dp).aspectRatio(1.3f).alpha(if (date.before(today)) 0.2f else 1f)


                                .background(if (isSelected) accentColor.copy(alpha = 0.2f)

                            else if (entry == null || (
                                        entry.location.isBlank() &&
                                                entry.event.isBlank() &&
                                                entry.status.isBlank() &&
                                                entry.schedule.isBlank() &&
                                                entry.details.isBlank() &&
                                                entry.links.isBlank()
                                        ))


                                getThemeColor("Cal_EmptyDay", refData, isDarkMode, Color.Transparent) else Color.Transparent).clickable { selectedDate = date }

                                .border(
                                    when {
                                        isSelected -> 4.dp
                                        date.time >= System.currentTimeMillis() - 86400000L && date.time <= System.currentTimeMillis() -> 2.dp
                                        else -> 0.dp
                                    },
                                    when {
                                        isSelected -> accentColor
                                        // this is the color of the today box in calendar view
                                        date.time >= System.currentTimeMillis() - 86400000L && date.time <= System.currentTimeMillis() -> Color(0xFF73b6d3)
                                        else -> Color.Transparent
                                    }
                                )


                                , contentAlignment = Alignment.Center) {

                                if (emojis.isEmpty()) Text((d+1).toString(), color = textMainColor) else if (emojis.size == 1) Text(emojis[0], fontSize = 24.sp) else Column(horizontalAlignment = Alignment.CenterHorizontally) { Row { Text(emojis.getOrNull(0) ?: "", fontSize = 14.sp); Text(emojis.getOrNull(1) ?: "", fontSize = 14.sp) }; if (emojis.size > 2) Row { Text(emojis.getOrNull(2) ?: "", fontSize = 14.sp); Text(emojis.getOrNull(3) ?: "", fontSize = 14.sp) } }
                            }
                        }
                        items(trailingEmptyDays) { i -> Box(modifier = Modifier.padding(1.dp).aspectRatio(1.3f).alpha(0.4f).background(getThemeColor("Cal_PrevMonth", refData, isDarkMode, Color.LightGray)), contentAlignment = Alignment.Center) { Text("${i + 1}", color = textMainColor) } }
                    }
                }
                // ========== spacer above schedule button here ===========
                Box(modifier = Modifier.fillMaxWidth().height(8.dp).pointerInput(Unit) { detectDragGestures { _, drag -> topHeight = (topHeight + drag.y).coerceIn(180f, 500f) } })

                Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp).clip(RoundedCornerShape(16.dp)).background(headerScheduleColor).padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                    Text("Schedule", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = headerScheduleText)
                }

                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 4.dp)) {
                    Text("Date", fontSize = 12.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(1f))
                    Text("Location", fontSize = 12.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(2f))
                    Text("Event", fontSize = 12.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(3f))
                }

                val listState = rememberLazyListState()
                ScrollableLazyColumnWithBar(modifier = Modifier.weight(1f).padding(horizontal = 24.dp), listState = listState, indicatorColor = scrollIndicatorColor) {
                    items(monthEntries.filter { it.location.isNotBlank() || it.event.isNotBlank() || it.status.isNotBlank() || it.schedule.isNotBlank() }) { e ->
                        val statusEmoji = refData.statuses[e.status.split(",").firstOrNull()?.trim() ?: ""] ?: ""
                        Row(modifier = Modifier.fillMaxWidth().clickable { selectedDate = e.date }.padding(vertical = 6.dp)) {
                            Text("${SimpleDateFormat("dd", Locale.getDefault()).format(e.date)} $statusEmoji".trim(), modifier = Modifier.weight(1f), color = textMainColor)
                            Text("${refData.locations[e.location] ?: ""} ${e.location}".trim(), modifier = Modifier.weight(2f), color = textMainColor)
                            Text(e.event.split(",").joinToString(" • ") { evt -> "${refData.events[evt.trim()] ?: ""} ${evt.trim()}" }.trim(), modifier = Modifier.weight(3f), color = textMainColor)
                        }
                    }
                }
                Box(modifier = Modifier.fillMaxWidth().height(14.dp).pointerInput(Unit) { detectDragGestures { _, drag -> bottomHeight = (bottomHeight - drag.y).coerceIn(150f, 450f) } })

                // DAY PREVIEW PART
                Column(modifier = Modifier.height(bottomHeight.dp).background(bgMain)) {
                    val entry = entries.find { it.date == selectedDate }
                    val dateStr = selectedDate?.let { SimpleDateFormat("EEEE dd MMMM yyyy", Locale.getDefault()).format(it) } ?: "Select a day"

                    Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp).clip(RoundedCornerShape(16.dp)).background(headerPrevBg).clickable { if (selectedDate != null) showDayView = true }.padding(12.dp)) {
                        Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(dateStr, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = headerPrevText)
                            if (entry != null && (entry.location.isNotBlank() || entry.event.isNotBlank())) {
                                Spacer(Modifier.height(2.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (entry.location.isNotBlank()) {
                                        val locEmoji = refData.locations[entry.location] ?: "📍"
                                        Text("$locEmoji ${entry.location}", fontSize = 12.sp, color = headerPrevText)
                                    }
                                    if (entry.location.isNotBlank() && entry.event.isNotBlank()) {
                                        Text(" | ", fontSize = 12.sp, color = headerPrevText.copy(alpha=0.5f))
                                    }
                                    if (entry.event.isNotBlank()) {
                                        val evtEmoji = refData.events[entry.event.split(",").firstOrNull()?.trim() ?: ""] ?: "🌍"
                                        Text("$evtEmoji ${entry.event}", fontSize = 12.sp, color = headerPrevText, maxLines=1, overflow=TextOverflow.Ellipsis)
                                    }
                                }
                            }
                        }
                    }

                    if (selectedDate != null && entry != null) {
                        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (entry.status.isNotBlank()) {
                                    Row {
                                        entry.status.split(",").forEachIndexed { index, s ->
                                            val statName = s.trim()
                                            if (statName.isNotEmpty()) {
                                                if (index > 0) Spacer(Modifier.width(8.dp))
                                                val statEmoji = refData.statuses[statName] ?: ""
                                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.background(accentColor.copy(alpha = 0.2f), RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                                                    Text(statEmoji, fontSize = 12.sp); Spacer(Modifier.width(4.dp)); Text(statName, fontWeight = FontWeight.Bold, color = textMainColor, fontSize = 11.sp)
                                                }
                                            }
                                        }
                                    }
                                } else { Spacer(Modifier.width(1.dp)) }

                                Text("📅", fontSize = 18.sp, modifier = Modifier.clickable { coroutineScope.launch { previewScrollState.animateScrollTo(0) } }.padding(horizontal = 4.dp))
                                Text("ℹ️", fontSize = 18.sp, modifier = Modifier.clickable { coroutineScope.launch { previewScrollState.animateScrollTo(previewScrollState.maxValue / 2) } }.padding(horizontal = 4.dp))
                                Text("🗺️", fontSize = 18.sp, modifier = Modifier.clickable { coroutineScope.launch { previewScrollState.animateScrollTo((previewScrollState.maxValue * 0.75f).toInt()) } }.padding(horizontal = 4.dp))
                                Text("🔗", fontSize = 18.sp, modifier = Modifier.clickable { coroutineScope.launch { previewScrollState.animateScrollTo(previewScrollState.maxValue) } }.padding(start = 4.dp))
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(refData.buttons["Icon_Share_Day"] ?: "📤", fontSize = 20.sp, modifier = Modifier.clickable { shareDayLogic() }.padding(horizontal = 8.dp))
                                Text(refData.buttons["Icon_Clear_Day"] ?: "🗑️", fontSize = 20.sp, modifier = Modifier.clickable { clearSelectedDayLogic() }.padding(horizontal = 8.dp))
                                Text(refData.buttons["Icon_Edit_Day"] ?: "✏️", fontSize = 20.sp, modifier = Modifier.clickable { showEdit = true }.padding(horizontal = 8.dp))
                                Text(refData.buttons["Icon_ExpandAll"] ?: "↕️", fontSize = 20.sp, modifier = Modifier.clickable { expandAllPreview = !expandAllPreview }.padding(start = 8.dp))
                            }
                        }

                        Box(modifier = Modifier.weight(1f).onGloballyPositioned { previewViewportHeightPx = it.size.height }) {
                            Column(modifier = Modifier.padding(horizontal = 16.dp).verticalScroll(previewScrollState).onGloballyPositioned { previewContentHeightPx = it.size.height }) {
                                if (entry.schedule.isNotBlank()) {
                                    val currentBorder = if (previewSchedExpanded) borderSchedule else borderSchedule.copy(alpha = 0.5f)
                                    Box(modifier = Modifier.fillMaxWidth().border(2.dp, currentBorder, RoundedCornerShape(12.dp)).background(prevSchedBg, RoundedCornerShape(12.dp)).clickable { previewSchedExpanded = !previewSchedExpanded }.padding(12.dp)) {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically) { Text("SCHEDULE", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(1f)); Text("▼", fontSize = 12.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.rotate(if (previewSchedExpanded) 180f else 0f)) }
                                            if (previewSchedExpanded) {
                                                Spacer(Modifier.height(8.dp))
                                                val lines = entry.schedule.split("\n").filter { it.isNotBlank() }
                                                lines.forEachIndexed { index, line ->
                                                    val parts = line.split(":", limit = 2)
                                                    val timeStr = if (parts.size > 1 && parts[0].trim().length <= 5) parts[0].trim() else ""
                                                    val actStr = if (parts.size > 1 && parts[0].trim().length <= 5) parts[1].trim() else line.trim()
                                                    var rowEmoji = ""
                                                    refData.schedules.forEach { (keyword, emoji) -> if (actStr.contains(keyword, ignoreCase = true)) rowEmoji = emoji }

                                                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = if (index == lines.lastIndex) 0.dp else 8.dp), verticalAlignment = Alignment.Top) {
                                                        Text(timeStr, modifier = Modifier.width(45.dp), fontWeight = FontWeight.Bold, color = textMainColor, fontSize = 13.sp)
                                                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 8.dp)) {
                                                            Box(modifier = Modifier.size(10.dp).background(borderSchedule, CircleShape).border(2.dp, prevSchedBg, CircleShape))
                                                            if (index != lines.lastIndex) Box(modifier = Modifier.width(2.dp).height(24.dp).background(borderSchedule.copy(alpha = 0.5f)))
                                                        }
                                                        Text(actStr, modifier = Modifier.weight(1f).padding(top = 1.dp, end = 4.dp), color = textMainColor, fontSize = 13.sp)
                                                        if (rowEmoji.isNotEmpty()) Text(rowEmoji, fontSize = 20.sp, modifier = Modifier.padding(start = 4.dp))
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    Spacer(Modifier.height(8.dp))
                                }
                                if (entry.details.isNotBlank()) {
                                    val currentBorder = if (previewDetailsExpanded) accentColor else borderDetails
                                    Box(modifier = Modifier.fillMaxWidth().border(2.dp, currentBorder, RoundedCornerShape(12.dp)).background(prevDetailBg, RoundedCornerShape(12.dp)).clickable { previewDetailsExpanded = !previewDetailsExpanded }.padding(12.dp)) {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically) { Text("DETAILS", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(1f)); Text("▼", fontSize = 12.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.rotate(if (previewDetailsExpanded) 180f else 0f)) }
                                            if (previewDetailsExpanded) { Spacer(Modifier.height(8.dp)); DetailsWrappingGrid(entry.details, refData, isDarkMode, textMainColor, uriHandler, borderSchedule) }
                                        }
                                    }
                                    Spacer(Modifier.height(8.dp))
                                }
                                if (entry.links.isNotBlank()) {
                                    val currentBorder = if (previewLinksExpanded) accentColor else borderFiles
                                    Box(modifier = Modifier.fillMaxWidth().border(2.dp, currentBorder, RoundedCornerShape(12.dp)).background(prevFilesBg, RoundedCornerShape(12.dp)).clickable { previewLinksExpanded = !previewLinksExpanded }.padding(12.dp)) {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically) { Text("DAY FILES", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.weight(1f)); Text("▼", fontSize = 12.sp, color = textMainColor.copy(alpha = 0.5f), modifier = Modifier.rotate(if (previewLinksExpanded) 180f else 0f)) }
                                            if (previewLinksExpanded) { Spacer(Modifier.height(8.dp)); LinksWrappingGrid(entry.links, refData, isDarkMode, textMainColor, uriHandler) }
                                        }
                                    }
                                    Spacer(Modifier.height(16.dp))
                                }
                            }
                            val isScrollable = previewContentHeightPx > previewViewportHeightPx
                            if (isScrollable) {
                                val indicatorHeightDp = with(density) { previewViewportHeightPx.toDp() * previewViewportHeightPx / previewContentHeightPx }
                                val indicatorOffsetDp = with(density) { previewScrollState.value.toDp() * previewViewportHeightPx / previewContentHeightPx }
                                Box(modifier = Modifier.align(Alignment.TopEnd).padding(end = 4.dp, top = indicatorOffsetDp).width(4.dp).height(indicatorHeightDp).clip(RoundedCornerShape(2.dp)).background(scrollIndicatorColor))
                            }
                        }
                    } else { Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("No data", color = textMainColor) } }
                }
            }
        }

        if (showMoreMenu) ModalBottomSheet(onDismissRequest = { showMoreMenu = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Dark Mode", color = textMainColor)
                    Spacer(Modifier.weight(1f))
                    Switch(isDarkMode, onCheckedChange = { newVal ->
                        isDarkMode = newVal
                        sharedPreferences.edit().putBoolean("dark_mode", newVal).apply()
                    })
                }
                Spacer(Modifier.height(16.dp))
                Button(onClick = { onSignOut(); showMoreMenu = false }, colors = ButtonDefaults.buttonColors(containerColor = Color.Red)) { Text("Sign Out", color = Color.White) }
                Spacer(Modifier.height(32.dp))
            }
        }

        if (showEdit && selectedDate != null) {
            Box(modifier = Modifier.fillMaxSize().background(bgMain).zIndex(10f)) {
                EditScreen(
                    date = selectedDate!!, existingEntries = entries, refData = refData, tripsList = tripsList, isDarkMode = isDarkMode,
                    onSaveAndNav = { newEntry, navDate ->
                        val r = entries.find { it.date == newEntry.date }?.rowIndex ?: -1

                        if (r != -1) {
                            isSyncing = true   // 👈 MOVE THIS OUTSIDE

                            coroutineScope.launch(Dispatchers.IO) {
                                try {

                                    sheetsService.spreadsheets().values().update(spreadsheetId, "sheet1!C$r:I$r", ValueRange().setValues(listOf(listOf(newEntry.location, newEntry.event, newEntry.status, newEntry.schedule, newEntry.details, newEntry.links, newEntry.tripName)))).setValueInputOption("USER_ENTERED").execute()
                                    syncTrigger++
                                } catch (_: Exception) {} finally { isSyncing = false }
                            }
                        }
                        selectedDate = navDate
                    },
                    onMove = { oldDate, newEntry ->
                        val oR = entries.find { it.date == oldDate }?.rowIndex ?: -1
                        val nR = entries.find { it.date == newEntry.date }?.rowIndex ?: -1
                        if (oR != -1 && nR != -1) {
                            coroutineScope.launch(Dispatchers.IO) {
                                try {
                                    isSyncing = true
                                    sheetsService.spreadsheets().values().update(spreadsheetId, "sheet1!C$oR:I$oR", ValueRange().setValues(listOf(listOf("", "", "", "", "", "", "")))).setValueInputOption("USER_ENTERED").execute()
                                    sheetsService.spreadsheets().values().update(spreadsheetId, "sheet1!C$nR:I$nR", ValueRange().setValues(listOf(listOf(newEntry.location, newEntry.event, newEntry.status, newEntry.schedule, newEntry.details, newEntry.links, newEntry.tripName)))).setValueInputOption("USER_ENTERED").execute()
                                    syncTrigger++
                                } catch (_: Exception) {} finally { isSyncing = false }
                            }
                        }
                        showEdit = false
                    },
                    onCancel = { showEdit = false }
                )
            }
        }

        if (showDayView && selectedDate != null) {
            Box(modifier = Modifier.fillMaxSize().zIndex(5f)) {
                DayScreen(date = selectedDate!!, entries = entries, refData = refData, isDarkMode = isDarkMode, onClose = { showDayView = false }, onEdit = { showEdit = true }, onClear = { clearSelectedDayLogic(); showDayView = false }, onDateChange = { newDate -> selectedDate = newDate }, onOpenSheet = { uriHandler.openUri("https://docs.google.com/spreadsheets/d/$spreadsheetId") }, onSync = { syncTrigger++ }, onOpenMore = { showMoreMenu = true }, onOpenTrip = { showDayView = false; showTripView = true; if (selectedTripName == null) selectedTripName = tripsList.firstOrNull() ?: "" })
            }
        }

        if (showTripView) {
            val safeTripName = selectedTripName ?: ""
            Box(modifier = Modifier.fillMaxSize().zIndex(15f)) {
                TripScreen(
                    currentTripName = safeTripName, allEntries = entries, refData = refData, isDarkMode = isDarkMode, onClose = { showTripView = false }, onHeaderClick = { showTripSelectorDropdown = true },
                    onDeleteTrip = { tripToDelete -> deleteTripLogic(tripToDelete); showTripView = false }, onShareTrip = { tripToShare -> shareTripLogic(tripToShare) },
                    onRemoveDayFromTrip = { entryToRemove ->
                        if (entryToRemove.rowIndex != -1) {
                            val updatedEntry = entryToRemove.copy(tripName = "")
                            entries = entries.map { entryItem -> if (entryItem.rowIndex == entryToRemove.rowIndex) updatedEntry else entryItem }
                            coroutineScope.launch(Dispatchers.IO) {
                                try {
                                    isSyncing = true
                                    sheetsService.spreadsheets().values().update(spreadsheetId, "sheet1!I${entryToRemove.rowIndex}", ValueRange().setValues(listOf(listOf("")))).setValueInputOption("USER_ENTERED").execute()
                                    syncTrigger++
                                } catch (_: Exception) {} finally { isSyncing = false }
                            }
                        }
                    },
                    onAddDayToTrip = { entryToAdd, tripName ->
                        if (entryToAdd.rowIndex != -1) {
                            val updatedEntry = entryToAdd.copy(tripName = tripName)
                            entries = entries.map { entryItem -> if (entryItem.rowIndex == entryToAdd.rowIndex) updatedEntry else entryItem }
                            coroutineScope.launch(Dispatchers.IO) {
                                try {
                                    isSyncing = true
                                    sheetsService.spreadsheets().values().update(spreadsheetId, "sheet1!I${entryToAdd.rowIndex}", ValueRange().setValues(listOf(listOf(tripName)))).setValueInputOption("USER_ENTERED").execute()
                                    syncTrigger++
                                } catch (_: Exception) {} finally { isSyncing = false }
                            }
                        }
                    },
                    onOpenDayView = { dayDate ->
                        selectedDate = dayDate
                        showTripView = false
                        showDayView = true
                    }
                )

                Box(modifier = Modifier.fillMaxWidth().padding(top = 96.dp), contentAlignment = Alignment.TopCenter) {
                    DropdownMenu(expanded = showTripSelectorDropdown, onDismissRequest = { showTripSelectorDropdown = false }, modifier = Modifier.zIndex(25f).fillMaxWidth(0.8f).background(accentColor)) {
                        val sdfShort = SimpleDateFormat("MMM dd", Locale.getDefault())
                        tripsList.forEach { tripId ->
                            val tripDays = entries.filter { it.tripName == tripId }; val firstDayOfTrip = tripDays.minByOrNull { it.date }; val lastDayOfTrip = tripDays.maxByOrNull { it.date }; val loc = firstDayOfTrip?.location ?: tripId
                            val dateStr = if (firstDayOfTrip != null && lastDayOfTrip != null) "${sdfShort.format(firstDayOfTrip.date)} - ${sdfShort.format(lastDayOfTrip.date)}" else ""
                            val displayName = if (dateStr.isNotEmpty()) "$dateStr | $loc" else loc
                            DropdownMenuItem(text = { Text(displayName, color = Color.White) }, onClick = { selectedTripName = tripId; showTripSelectorDropdown = false })
                        }
                        HorizontalDivider(color = Color.White.copy(alpha = 0.5f))
                        DropdownMenuItem(text = { Text("New Trip", color = Color.White, fontWeight = FontWeight.Bold) }, onClick = { showNewTripDatePicker = true; showTripSelectorDropdown = false })
                    }
                }
            }
        }

        if (showNewTripDatePicker) {
            val datePickerState = rememberDatePickerState()
            DatePickerDialog(
                onDismissRequest = { showNewTripDatePicker = false },
                confirmButton = {
                    TextButton(onClick = {
                        datePickerState.selectedDateMillis?.let { millis -> newTripStartDateUtc = millis; showNewTripNamePrompt = true }
                        showNewTripDatePicker = false
                    }) { Text("Confirm") }
                }
            ) { DatePicker(state = datePickerState) }
        }
    }
}