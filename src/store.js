import { createStore } from 'vuex'

import LZString from 'lz-string'

/******************************************************************************/
const pascal = function(n) {
    var add = 1, init = 0
    for (var i = 0; i < n; i++) { init += add; add += 1; }
    return init
}
/*----------------------------------------------------------------------------*/
const fibonacci = function(n) {
    var a = 0, b = 1, f = 1
    for (var i = 2; i <= n; i++) { f = a + b; a = b; b = f; }
    return f
}
/*----------------------------------------------------------------------------*/
const threat = function(stats) {

    var threshholds = [320, 800, 1440, 2240, 3200, 4320, 5600, 7040, 8640, 10400, 12320, 14400]
    var level = 0
    for (let i = 0; i < threshholds.length; i++) {
        if (stats.power * stats.speed >= threshholds[i]) level += 1
        else continue
    }
    return Math.min(11, level)
}
/******************************************************************************/

export const store = createStore({
    state() {
        return {
        
            /*----------------------------------------------------------------*/
            data: {},
            version: '1.0',
            /*----------------------------------------------------------------*/
            stars: [],
            ships: [],
            resources: [],
            producers: [],
            achievements: [],
            storageUpgrades: [],
            /*----------------------------------------------------------------*/
            machineT1: [],
            machineT2: [],
            machineT3: [],
            machineT4: [],
            machineT5: [],
            machineT6: [],
            /*----------------------------------------------------------------*/
            resAchievements: [],
            prodAchievements: [],
            /*----------------------------------------------------------------*/
            storagePrice: 1,
            storageExcess: 1,
            titanSwapingCount: 0,
            /*----------------------------------------------------------------*/
            lastUpdateTime: new Date().getTime(),
            /*----------------------------------------------------------------*/
            rank: { level:1, xpNeeded:0, xpLeft:0, percent:0, current:0 },
            /*----------------------------------------------------------------*/
            autoSaveInterval: 30 * 1000,
            timeSinceAutoSave: 0,
            /*----------------------------------------------------------------*/
            locale: 'en',
            activePane: 'metalPane',
            companyName: 'NG Space',
            notifications: [],
            newAchievement: false,
            notifAutoSave: true,
            notifAchievement: true,
            displayLockedItems: false,
            displayPinnedItems: false,
            displayDoneTechs: true,
            displayRoadmap: true,
            displayEmcShortcut: false,
            collapsed: [],
            pinned: [],
            /*----------------------------------------------------------------*/
            fleet: { power:0, defense:0, speed:0 },
            activeFleet: { power:0, defense:0, speed:0 },
            /*----------------------------------------------------------------*/
            username: null,
            token: null,
            /*----------------------------------------------------------------*/
            emcAmount: 'max',
            autoResource: null,
            autoEmcInterval: 1 * 1000,
            timeSinceAutoEmc: 0,
            /*----------------------------------------------------------------*/
            stats: {
                startDate: new Date().getTime(),
                lastEnlightenDate: new Date().getTime(),
                enlightenCount: 0,
                allTimeUltrite: 0,
                lastRebirthDate: new Date().getTime(),
                rebirthCount : 0,
                allTimeDarkmatter: 0,
                manualGain: { current:0, allTime:0 },
                machineT1: { current:0, allTime:0 },
                machineT2: { current:0, allTime:0 },
                machineT3: { current:0, allTime:0 },
                machineT4: { current:0, allTime:0 },
                machineT5: { current:0, allTime:0 },
                machineT6: { current:0, allTime:0 },
                ships: { current:0, allTime:0 },
                starOwned: { current:0, allTime:0 },
            },
            /*----------------------------------------------------------------*/
            context: {
                count: {},
            },
            /*----------------------------------------------------------------*/
        }
    },
    getters: {
    
        /*--------------------------------------------------------------------*/
        isNotif: (state) => (id) => { return state.notifications.includes(id) },
        /*--------------------------------------------------------------------*/
        hasNotif: (state) => {
        
            if (state.notifications.length > 0 && !state.notifications.includes('achievementPane')) return true
            return false
        },
        /*--------------------------------------------------------------------*/
        isCollapsed: (state) => (id) => { return state.collapsed.includes(id) },
        isPinned: (state) => (id) => {
            
            let result = false
            state.pinned.forEach(pane => {
                if (pane.id == id) {
                    result = true
                    return
                }
            })
            
            return result
        },
        /*--------------------------------------------------------------------*/
        getThreat: (state) => (id) => {
            
            let item = state.data[id]
            return threat(item.stats)
        },
        /*--------------------------------------------------------------------*/
        getSpyChance: (state) => (id) => {
            
            let item = state.data[id]
            let t = threat(item.stats)
            return Math.min(100, state.data['shipT1'].active / (t + 1) * (20 / (item.spy + 1)))
        },
        /*--------------------------------------------------------------------*/
        getFactionMultiplier: (state) => (id) => {
        
            var op = state.data[id].opinion
            if (op >= 20) return 0.5
            else if (op >= -20 && op < 20) return 1
            else if (op >= -60 && op < -20) return 2
            else if (op < -60) return 3
            else return 0
        },
        /*--------------------------------------------------------------------*/
        getInvadeChance: (state, getters) => (id) => {
            
            let activeFleet = state.activeFleet
            if (activeFleet.power != 0) {
            
                let star = state.data[id]
                
                let multi = getters.getFactionMultiplier(star.faction)
                if (multi == 0) return 'peace'

                let damage = (activeFleet.power / star.stats.defense * multi) * activeFleet.speed
                let starDamage = (star.stats.power * multi / Math.max(activeFleet.defense, 1)) * star.stats.speed
                if (damage > starDamage) return (damage / starDamage) - 0.5
                else if (damage != 0) return Math.max(0, 1.5 - (starDamage / damage))
            }
            
            return 0
        },
        /*--------------------------------------------------------------------*/
        getDMWonders: (state) => {
        
            var dm = 0
            if (state.data['wonderPrecious1'].count > 0 && state.data['wonderEnergetic1'].count > 0 && state.data['wonderTechnological1'].count > 0 && state.data['wonderMeteorite1'].count > 0) dm += 4
            if (state.data['wonderComm'].count > 0 && state.data['wonderSpaceship'].count > 0 && state.data['wonderAntimatter'].count > 0 && state.data['wonderPortal'].count > 0) dm += 4
            if (state.data['wonderStargate'].count > 0) dm += 2
            return dm
        },
        /*--------------------------------------------------------------------*/
        getDMSpheres: (state) => {
        
            var dm = 0
            var sphere = state.data['dysonT3']
            if (sphere.count != 0) dm += 10
            dm += sphere.count * 5
            return dm
        },
        /*--------------------------------------------------------------------*/
        getDMResearches: (state) => {
        
            return Math.floor((state.data['boostProduction'].count + state.data['boostEnergy'].count + state.data['boostScience'].count + state.data['boostEnergyStorage'].count) / 25) * 2
        },
        /*--------------------------------------------------------------------*/
        getDMRank: (state) => {
        
            return state.rank.level * 2
        },
        /*--------------------------------------------------------------------*/
        getDMSwarms: (state) => {
        
            return Math.floor(Math.pow(2 * state.data['dysonT2'].count + 0.25, 0.5) - 0.5)
        },
        /*--------------------------------------------------------------------*/
        getPotentialDM: (state, getters) => {
        
            return getters.getDMWonders + getters.getDMSpheres + getters.getDMResearches + getters.getDMRank + getters.getDMSwarms
        },
        /*--------------------------------------------------------------------*/
        getStarPower: (state, getters) => (id) => {
        
            var star = state.data[id]
            if (star.spy <= 0) return '???'
            
            var multi = getters.getFactionMultiplier(star.faction)
            var val = Math.floor(star.stats.power * multi).toString()
            var unknown = ''
            for (var i = 0; i < val.length - (star.spy - 1); i++) { unknown += '?' }
            return val.substring(0, star.spy - 1) + unknown
        },
        /*--------------------------------------------------------------------*/
        getStarDefense: (state, getters) => (id) => {
        
            var star = state.data[id]
            if (star.spy <= 0) return '???'
            
            var multi = getters.getFactionMultiplier(star.faction)
            var val = Math.floor(star.stats.defense * multi).toString()
            var unknown = ''
            for (var i = 0; i < val.length - (star.spy - 1); i++) { unknown += '?' }
            return val.substring(0, star.spy - 1) + unknown
        },
        /*--------------------------------------------------------------------*/
        getStarSpeed: (state) => (id) => {
        
            var star = state.data[id]
            if (star.spy <= 0) return '???'
            
            var val = Math.floor(star.stats.speed).toString()
            var unknown = ''
            for (var i = 0; i < val.length - (star.spy - 1); i++) { unknown += '?' }
            return val.substring(0, star.spy - 1) + unknown
        },
        /*--------------------------------------------------------------------*/
        getULStars: (state) => {
        
            let ownedStarCount = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.status == 'owned') ownedStarCount += 1
                if (star.subStatus == 'terraformed' || star.subStatus == 'statued') ownedStarCount += 5
            }
            
            return ownedStarCount
        },
        /*--------------------------------------------------------------------*/
        getULDarkmatter: (state, getters) => {
        
            return Math.floor((state.data['darkmatter'].count + getters.getPotentialDM) / 10)
        },
        /*--------------------------------------------------------------------*/
        getULStatues: (state) => {
        
            let ul = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.subStatus == 'statued') ul += 5
            }
            
            return ul
        },
        /*--------------------------------------------------------------------*/
        getPotentialUL: (state, getters) => {
        
            return getters.getULStars + getters.getULDarkmatter + getters.getULStatues
        },
        /*--------------------------------------------------------------------*/
        canBuild: (state) => (id) => {
        
            let canBuild = true
            let item = state.data[id]
            
            if ('max' in item && item.count >= item.max) canBuild = false

            if ('costs' in item) {
                item['costs'].forEach(cost => {
                    if (state.data[cost.id].count - cost.count < 0) {
                        canBuild = false
                        return
                    }
                })
            }
            
            return canBuild
        },
        /*--------------------------------------------------------------------*/
        getStorageCap: (state) => (id) => {
            
            let item = state.data[id]
            return item.storage * state.storageExcess
        },
        /*--------------------------------------------------------------------*/
        getStatuesCount(state) {
        
            let statuesCount = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.subStatus == 'statued') statuesCount += 1
            }
            return statuesCount
        },
        /*--------------------------------------------------------------------*/
        getCurrentTitan(state) {

            let list = []
            state.resources.forEach(item => { if (item.titan == true) list.push(item.id) })
            return list
        },
        /*--------------------------------------------------------------------*/
        getNotCurrentTitan(state) {

            let list = []
            state.resources.forEach(item => { if (item.titan == false) list.push(item.id) })
            return list
        },
        /*--------------------------------------------------------------------*/
        getOwnedStarCount(state) {
        
            let ownedStarCount = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.status == 'owned') ownedStarCount += 1
            }
            return ownedStarCount
        },
        /*--------------------------------------------------------------------*/
        getCtxCount: (state) => (id) => { return state.context.count[id] },
        /*--------------------------------------------------------------------*/
    },
    mutations: {
    
        /*--------------------------------------------------------------------*/
        setLocale(state, payload) { state.locale = payload },
        setCompanyName(state, payload) { state.companyName = payload },
        setAutoSaveInterval(state, payload) { state.autoSaveInterval = payload * 1000 },
        setNotifAutoSave(state, payload) { state.notifAutoSave = payload },
        setNotifAchievement(state, payload) { state.notifAchievement = payload },
        setDisplayLockedItems(state, payload) { state.displayLockedItems = payload },
        setDisplayPinnedItems(state, payload) { state.displayPinnedItems = payload },
        setDisplayDoneTechs(state, payload) { state.displayDoneTechs = payload },
        setDisplayRoadmap(state, payload) { state.displayRoadmap = payload },
        setAutoStorageUpgrade(state, payload) { state.data[payload.id].auto = payload.auto },
        setUsername(state, payload) { state.username = payload },
        setToken(state, payload) { state.token = payload },
        setEmcAmount(state, payload) { state.emcAmount = payload },
        setAutoResource(state, payload) { state.autoResource = payload },
        setAutoEmcInterval(state, payload) { state.autoEmcInterval = payload * 1000 },
        setDisplayEmcShortcut(state, payload) { state.displayEmcShortcut = payload },
        /*--------------------------------------------------------------------*/
        setActivePane(state, payload) {

            state.activePane = payload
            
            let index = state.notifications.indexOf(payload)
            if (index > -1) state.notifications.splice(index, 1)
        },
        /*--------------------------------------------------------------------*/
        setLastUpdateTime(state, payload) { state.lastUpdateTime = payload },
        setTimeSinceAutoSave(state, payload) { state.timeSinceAutoSave = payload },
        setTimeSinceAutoEmc(state, payload) { state.timeSinceAutoEmc = payload },
        /*--------------------------------------------------------------------*/
        addNotif(state, payload) { if (!(state.notifications.includes(payload) || state.activePane === payload)) state.notifications.push(payload) },
        /*--------------------------------------------------------------------*/
        setDataProd(state, payload) { if (payload.prod  != state.data[payload.id].prod) state.data[payload.id].prod  = payload.prod },
        setDataBoost(state, payload) { if (payload.boost  != state.data[payload.id].boost) state.data[payload.id].boost = payload.boost },
        setDataCount(state, payload) { if (payload.count != state.data[payload.id].count) state.data[payload.id].count = payload.count },
        setDataProduction(state, payload) { if (payload.production  != state.data[payload.id].production) state.data[payload.id].production = payload.production },
        setDataConsumption(state, payload) { if (payload.consumption != state.data[payload.id].consumption) state.data[payload.id].consumption = payload.consumption },
        /*--------------------------------------------------------------------*/
        computeStorage(state, id) {
            
            let item = state.data[id]
            item.storage = item.baseStorage
            
            for (let i in state.data) {
                let building = state.data[i]
                if ('storage' in building && building.storage.id == id && building.count > 0) {
                
                    if (building.storage.type == 'DOUBLE') item.storage = item.baseStorage * Math.pow(2, building.count)
                    else if (building.storage.type == 'FIXED') {
                        
                        if (building.storage.id == 'energy') item.storage += (building.storage.count * building.count) * (1 + (0.01 * state.data['boostEnergyStorage'].count))
                        else item.storage += building.storage.count * building.count
                    }
                }
            }
        },
        /*--------------------------------------------------------------------*/
        computeCosts(state, id) {
            
            let item = state.data[id]
            item.costs = JSON.parse(JSON.stringify(item.baseCosts))
            
            item.costs.forEach(cost => {
                if (item.costType == 'EXPONENTIAL') cost.count = Math.floor(cost.count * Math.pow(1.1, item.count))
                else if (item.costType == 'DYSON') cost.count = Math.floor(cost.count * Math.pow(1.02, item.count))
                else if (item.costType == 'DOUBLE') cost.count = cost.count * Math.pow(2.0, item.count) * state.storagePrice
                
                if (state.data[cost.id].titan == true) cost.count *= 0.1
            })
            
            if (item.probeBaseCosts) {
                item.probeCosts = JSON.parse(JSON.stringify(item.probeBaseCosts))
                item.probeCosts.forEach(cost => {
                    if (state.data[cost.id].titan == true) cost.count *= 0.1
                })
            }
            
            if (item.terraformBaseCosts) {
                item.terraformCosts = JSON.parse(JSON.stringify(item.terraformBaseCosts))
                item.terraformCosts.forEach(cost => {
                    if (state.data[cost.id].titan == true) cost.count *= 0.1
                })
            }
            
            if (item.statueBaseCosts) {
                item.statueCosts = JSON.parse(JSON.stringify(item.statueBaseCosts))
                item.statueCosts.forEach(cost => {
                    if (state.data[cost.id].titan == true) cost.count *= 0.1
                })
            }
        },
        /*--------------------------------------------------------------------*/
        computeFleetStats(state) {
            
            let total = 0, activeTotal = 0
            
            let stats = { power:0, defense:0, speed:0 }
            let activeStats = { power:0, defense:0, speed:0 }
            
            for (let i in state.ships) {
            
                var item = state.ships[i]
                
                stats.power += item.stats.power * item.count
                stats.defense += item.stats.defense * item.count
                stats.speed += item.stats.speed * item.count
                total += item.count

                activeStats.power += item.stats.power * item.active
                activeStats.defense += item.stats.defense * item.active
                activeStats.speed += item.stats.speed * item.active
                activeTotal += item.active
            }
            
            stats.speed = Math.floor(stats.speed / total)
            state.fleet = JSON.parse(JSON.stringify(stats))
            
            activeStats.speed = Math.floor(activeStats.speed / activeTotal)
            state.activeFleet = JSON.parse(JSON.stringify(activeStats))
        },
        /*--------------------------------------------------------------------*/
        toggleCollapsed(state, id) {
            
            let index = state.collapsed.indexOf(id)
            if (index >= 0) state.collapsed.splice(index, 1)
            else state.collapsed.push(id)
        },
        /*--------------------------------------------------------------------*/
        togglePinned(state, payload) {
            
            let found = false
            let index = -1
            state.pinned.forEach(pane => {
                index += 1
                if (pane.id == payload.id) {
                    state.pinned.splice(index, 1)
                    found = true
                }
            })
            
            if (found == false) state.pinned.push(payload)
        },
        /*--------------------------------------------------------------------*/
    },
    actions: {
    
        // STARTING
        /*--------------------------------------------------------------------*/
        initialize({ state }) {
            
            // RESOURCE ACHIEVEMENTS
            /*----------------------------------------------------------------*/
            state.data['achMeteorite'] = { id:'achMeteorite', icon:'meteorite.png', data:'meteorite', unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achCarbon'] =    { id:'achCarbon',    icon:'carbon.png',    data:'carbon',    unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achOil'] =       { id:'achOil',       icon:'oil.png',       data:'oil',       unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achMetal'] =     { id:'achMetal',     icon:'metal.png',     data:'metal',     unlocked:true,  count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achGem'] =       { id:'achGem',       icon:'gem.png',       data:'gem',       unlocked:true,  count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achWood'] =      { id:'achWood',      icon:'wood.png',      data:'wood',      unlocked:true,  count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achSilicon'] =   { id:'achSilicon',   icon:'silicon.png',   data:'silicon',   unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achUranium'] =   { id:'achUranium',   icon:'uranium.png',   data:'uranium',   unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achLava'] =      { id:'achLava',      icon:'lava.png',      data:'lava',      unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achLunarite'] =  { id:'achLunarite',  icon:'lunarite.png',  data:'lunarite',  unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achMethane'] =   { id:'achMethane',   icon:'methane.png',   data:'methane',   unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achTitanium'] =  { id:'achTitanium',  icon:'titanium.png',  data:'titanium',  unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achGold'] =      { id:'achGold',      icon:'gold.png',      data:'gold',      unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achSilver'] =    { id:'achSilver',    icon:'silver.png',    data:'silver',    unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achHydrogen'] =  { id:'achHydrogen',  icon:'hydrogen.png',  data:'hydrogen',  unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achHelium'] =    { id:'achHelium',    icon:'helium.png',    data:'helium',    unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achIce'] =       { id:'achIce',       icon:'ice.png',       data:'ice',       unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achScience'] =   { id:'achScience',   icon:'science.png',   data:'science',   unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            state.data['achFuel'] =      { id:'achFuel',      icon:'fuel.png',      data:'fuel',      unlocked:false, count:0, progress:0, brackets:[50, 50000, 50000000, 50000000000, 50000000000000], }
            /*----------------------------------------------------------------*/
            
            // PRODUCER ACHIEVEMENTS
            /*----------------------------------------------------------------*/
            state.data['achEnergyT1'] =    { id:'achEnergyT1',    icon:'energy.png',    data:'energyT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT2'] =    { id:'achEnergyT2',    icon:'energy.png',    data:'energyT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT3'] =    { id:'achEnergyT3',    icon:'energy.png',    data:'energyT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT4'] =    { id:'achEnergyT4',    icon:'energy.png',    data:'energyT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT5'] =    { id:'achEnergyT5',    icon:'energy.png',    data:'energyT5',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achEnergyT6'] =    { id:'achEnergyT6',    icon:'energy.png',    data:'energyT6',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achPlasmaT1'] =    { id:'achPlasmaT1',    icon:'plasma.png',    data:'plasmaT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achPlasmaT2'] =    { id:'achPlasmaT2',    icon:'plasma.png',    data:'plasmaT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achPlasmaT3'] =    { id:'achPlasmaT3',    icon:'plasma.png',    data:'plasmaT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achPlasmaT4'] =    { id:'achPlasmaT4',    icon:'plasma.png',    data:'plasmaT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMeteoriteT1'] = { id:'achMeteoriteT1', icon:'meteorite.png', data:'meteoriteT1', unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMeteoriteT2'] = { id:'achMeteoriteT2', icon:'meteorite.png', data:'meteoriteT2', unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMeteoriteT3'] = { id:'achMeteoriteT3', icon:'meteorite.png', data:'meteoriteT3', unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMeteoriteT4'] = { id:'achMeteoriteT4', icon:'meteorite.png', data:'meteoriteT4', unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT1'] =    { id:'achCarbonT1',    icon:'carbon.png',    data:'carbonT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT2'] =    { id:'achCarbonT2',    icon:'carbon.png',    data:'carbonT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT3'] =    { id:'achCarbonT3',    icon:'carbon.png',    data:'carbonT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT4'] =    { id:'achCarbonT4',    icon:'carbon.png',    data:'carbonT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achCarbonT5'] =    { id:'achCarbonT5',    icon:'carbon.png',    data:'carbonT5',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT1'] =       { id:'achOilT1',       icon:'oil.png',       data:'oilT1',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT2'] =       { id:'achOilT2',       icon:'oil.png',       data:'oilT2',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT3'] =       { id:'achOilT3',       icon:'oil.png',       data:'oilT3',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT4'] =       { id:'achOilT4',       icon:'oil.png',       data:'oilT4',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achOilT5'] =       { id:'achOilT5',       icon:'oil.png',       data:'oilT5',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT1'] =     { id:'achMetalT1',     icon:'metal.png',     data:'metalT1',     unlocked:true,  count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT2'] =     { id:'achMetalT2',     icon:'metal.png',     data:'metalT2',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT3'] =     { id:'achMetalT3',     icon:'metal.png',     data:'metalT3',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT4'] =     { id:'achMetalT4',     icon:'metal.png',     data:'metalT4',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMetalT5'] =     { id:'achMetalT5',     icon:'metal.png',     data:'metalT5',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT1'] =       { id:'achGemT1',       icon:'gem.png',       data:'gemT1',       unlocked:true,  count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT2'] =       { id:'achGemT2',       icon:'gem.png',       data:'gemT2',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT3'] =       { id:'achGemT3',       icon:'gem.png',       data:'gemT3',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT4'] =       { id:'achGemT4',       icon:'gem.png',       data:'gemT4',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGemT5'] =       { id:'achGemT5',       icon:'gem.png',       data:'gemT5',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT1'] =      { id:'achWoodT1',      icon:'wood.png',      data:'woodT1',      unlocked:true,  count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT2'] =      { id:'achWoodT2',      icon:'wood.png',      data:'woodT2',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT3'] =      { id:'achWoodT3',      icon:'wood.png',      data:'woodT3',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT4'] =      { id:'achWoodT4',      icon:'wood.png',      data:'woodT4',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achWoodT5'] =      { id:'achWoodT5',      icon:'wood.png',      data:'woodT5',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT1'] =   { id:'achSiliconT1',   icon:'silicon.png',   data:'siliconT1',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT2'] =   { id:'achSiliconT2',   icon:'silicon.png',   data:'siliconT2',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT3'] =   { id:'achSiliconT3',   icon:'silicon.png',   data:'siliconT3',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT4'] =   { id:'achSiliconT4',   icon:'silicon.png',   data:'siliconT4',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSiliconT5'] =   { id:'achSiliconT5',   icon:'silicon.png',   data:'siliconT5',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT1'] =   { id:'achUraniumT1',   icon:'uranium.png',   data:'uraniumT1',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT2'] =   { id:'achUraniumT2',   icon:'uranium.png',   data:'uraniumT2',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT3'] =   { id:'achUraniumT3',   icon:'uranium.png',   data:'uraniumT3',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT4'] =   { id:'achUraniumT4',   icon:'uranium.png',   data:'uraniumT4',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achUraniumT5'] =   { id:'achUraniumT5',   icon:'uranium.png',   data:'uraniumT5',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT1'] =      { id:'achLavaT1',      icon:'lava.png',      data:'lavaT1',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT2'] =      { id:'achLavaT2',      icon:'lava.png',      data:'lavaT2',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT3'] =      { id:'achLavaT3',      icon:'lava.png',      data:'lavaT3',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT4'] =      { id:'achLavaT4',      icon:'lava.png',      data:'lavaT4',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLavaT5'] =      { id:'achLavaT5',      icon:'lava.png',      data:'lavaT5',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT1'] =  { id:'achLunariteT1',  icon:'lunarite.png',  data:'lunariteT1',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT2'] =  { id:'achLunariteT2',  icon:'lunarite.png',  data:'lunariteT2',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT3'] =  { id:'achLunariteT3',  icon:'lunarite.png',  data:'lunariteT3',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT4'] =  { id:'achLunariteT4',  icon:'lunarite.png',  data:'lunariteT4',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achLunariteT5'] =  { id:'achLunariteT5',  icon:'lunarite.png',  data:'lunariteT5',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT1'] =   { id:'achMethaneT1',   icon:'methane.png',   data:'methaneT1',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT2'] =   { id:'achMethaneT2',   icon:'methane.png',   data:'methaneT2',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT3'] =   { id:'achMethaneT3',   icon:'methane.png',   data:'methaneT3',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT4'] =   { id:'achMethaneT4',   icon:'methane.png',   data:'methaneT4',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achMethaneT5'] =   { id:'achMethaneT5',   icon:'methane.png',   data:'methaneT5',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT1'] =  { id:'achTitaniumT1',  icon:'titanium.png',  data:'titaniumT1',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT2'] =  { id:'achTitaniumT2',  icon:'titanium.png',  data:'titaniumT2',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT3'] =  { id:'achTitaniumT3',  icon:'titanium.png',  data:'titaniumT3',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT4'] =  { id:'achTitaniumT4',  icon:'titanium.png',  data:'titaniumT4',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achTitaniumT5'] =  { id:'achTitaniumT5',  icon:'titanium.png',  data:'titaniumT5',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT1'] =      { id:'achGoldT1',      icon:'gold.png',      data:'goldT1',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT2'] =      { id:'achGoldT2',      icon:'gold.png',      data:'goldT2',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT3'] =      { id:'achGoldT3',      icon:'gold.png',      data:'goldT3',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT4'] =      { id:'achGoldT4',      icon:'gold.png',      data:'goldT4',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achGoldT5'] =      { id:'achGoldT5',      icon:'gold.png',      data:'goldT5',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT1'] =    { id:'achSilverT1',    icon:'silver.png',    data:'silverT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT2'] =    { id:'achSilverT2',    icon:'silver.png',    data:'silverT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT3'] =    { id:'achSilverT3',    icon:'silver.png',    data:'silverT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT4'] =    { id:'achSilverT4',    icon:'silver.png',    data:'silverT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achSilverT5'] =    { id:'achSilverT5',    icon:'silver.png',    data:'silverT5',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT1'] =  { id:'achHydrogenT1',  icon:'hydrogen.png',  data:'hydrogenT1',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT2'] =  { id:'achHydrogenT2',  icon:'hydrogen.png',  data:'hydrogenT2',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT3'] =  { id:'achHydrogenT3',  icon:'hydrogen.png',  data:'hydrogenT3',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT4'] =  { id:'achHydrogenT4',  icon:'hydrogen.png',  data:'hydrogenT4',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHydrogenT5'] =  { id:'achHydrogenT5',  icon:'hydrogen.png',  data:'hydrogenT5',  unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT1'] =    { id:'achHeliumT1',    icon:'helium.png',    data:'heliumT1',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT2'] =    { id:'achHeliumT2',    icon:'helium.png',    data:'heliumT2',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT3'] =    { id:'achHeliumT3',    icon:'helium.png',    data:'heliumT3',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT4'] =    { id:'achHeliumT4',    icon:'helium.png',    data:'heliumT4',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achHeliumT5'] =    { id:'achHeliumT5',    icon:'helium.png',    data:'heliumT5',    unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achIceT1'] =       { id:'achIceT1',       icon:'ice.png',       data:'iceT1',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achIceT2'] =       { id:'achIceT2',       icon:'ice.png',       data:'iceT2',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achIceT3'] =       { id:'achIceT3',       icon:'ice.png',       data:'iceT3',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achIceT4'] =       { id:'achIceT4',       icon:'ice.png',       data:'iceT4',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achIceT5'] =       { id:'achIceT5',       icon:'ice.png',       data:'iceT5',       unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achScienceT1'] =   { id:'achScienceT1',   icon:'science.png',   data:'scienceT1',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achScienceT2'] =   { id:'achScienceT2',   icon:'science.png',   data:'scienceT2',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achScienceT3'] =   { id:'achScienceT3',   icon:'science.png',   data:'scienceT3',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achScienceT4'] =   { id:'achScienceT4',   icon:'science.png',   data:'scienceT4',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achScienceT5'] =   { id:'achScienceT5',   icon:'science.png',   data:'scienceT5',   unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achFuelT1'] =      { id:'achFuelT1',      icon:'fuel.png',      data:'fuelT1',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achFuelT2'] =      { id:'achFuelT2',      icon:'fuel.png',      data:'fuelT2',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achFuelT3'] =      { id:'achFuelT3',      icon:'fuel.png',      data:'fuelT3',      unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achDysonT1'] =     { id:'achDysonT1',     icon:'dyson.png',     data:'dysonT1',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achDysonT2'] =     { id:'achDysonT2',     icon:'dyson.png',     data:'dysonT2',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            state.data['achDysonT3'] =     { id:'achDysonT3',     icon:'dyson.png',     data:'dysonT3',     unlocked:false, count:0, progress:0, brackets:[5, 25, 75, 150, 250], }
            /*----------------------------------------------------------------*/
        
            // ENERGY
            /*----------------------------------------------------------------*/
            state.data['energy'] = { id:'energy', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, baseStorage:100000, toggle:'on', notifs:['energyPane', 'batteryPane'], }
            /*----------------------------------------------------------------*/
            state.data['energyT1'] = { id:'energyT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:50    }, { id:'gem',      count:25    }],                                outputs:[{ id:'energy', count:2   }], inputs:[{ id:'carbon',   count:1  }],                            notifs:['energyPane'], }
            state.data['energyT2'] = { id:'energyT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:30    }, { id:'gem',      count:35    }],                                outputs:[{ id:'energy', count:1.5 }],                                                                  notifs:['energyPane'], }
            state.data['energyT3'] = { id:'energyT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:110   }, { id:'titanium', count:90    }],                                outputs:[{ id:'energy', count:23  }], inputs:[{ id:'methane',  count:6  }],                            notifs:['energyPane'], }
            state.data['energyT4'] = { id:'energyT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:20000 }, { id:'titanium', count:10000 }],                                outputs:[{ id:'energy', count:153 }], inputs:[{ id:'uranium',  count:7  }],                            notifs:['energyPane'], }
            state.data['energyT5'] = { id:'energyT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:25000 }, { id:'gem',      count:30000 }, { id:'silver',  count:20000 }], outputs:[{ id:'energy', count:191 }], inputs:[{ id:'lava',     count:11 }],                            notifs:['energyPane'], }
            state.data['energyT6'] = { id:'energyT6', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:30000 }, { id:'titanium', count:20000 }, { id:'silicon', count:15000 }], outputs:[{ id:'energy', count:273 }], inputs:[{ id:'hydrogen', count:10 }, { id:'helium', count:10 }], notifs:['energyPane'], }
            /*----------------------------------------------------------------*/
            state.data['energyS1'] = { id:'energyS1', unlocked:false, count:0, storage:{ id:'energy', type:'FIXED', count:50000      }, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',  count:550000      }, { id:'gem',  count:550000      }, { id:'lunarite', count:330000      }], notifs:['batteryPane'], }
            state.data['energyS2'] = { id:'energyS2', unlocked:false, count:0, storage:{ id:'energy', type:'FIXED', count:500000     }, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',  count:5500000     }, { id:'gem',  count:5500000     }, { id:'lunarite', count:3300000     }], notifs:['batteryPane'], }
            state.data['energyS3'] = { id:'energyS3', unlocked:false, count:0, storage:{ id:'energy', type:'FIXED', count:5000000    }, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',  count:55000000    }, { id:'gem',  count:55000000    }, { id:'lunarite', count:33000000    }], notifs:['batteryPane'], }
            state.data['energyS4'] = { id:'energyS4', unlocked:false, count:0, storage:{ id:'energy', type:'FIXED', count:50000000   }, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',  count:550000000   }, { id:'gem',  count:550000000   }, { id:'lunarite', count:330000000   }], notifs:['batteryPane'], }
            state.data['energyS5'] = { id:'energyS5', unlocked:false, count:0, storage:{ id:'energy', type:'FIXED', count:500000000  }, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',  count:5500000000  }, { id:'gem',  count:5500000000  }, { id:'lunarite', count:3300000000  }], notifs:['batteryPane'], }
            state.data['energyS6'] = { id:'energyS6', unlocked:false, count:0, storage:{ id:'energy', type:'FIXED', count:5000000000 }, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',  count:55000000000 }, { id:'gem',  count:55000000000 }, { id:'lunarite', count:33000000000 }], notifs:['batteryPane'], }
            /*----------------------------------------------------------------*/

            // PLASMA
            /*----------------------------------------------------------------*/
            state.data['plasma'] = { id:'plasma', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:100000, toggle:'on', costType:'FIXED', baseCosts:[{ id:'energy', count:1000 }, { id:'hydrogen', count:10 }], notifs:['plasmaPane'], }
            /*----------------------------------------------------------------*/
            state.data['plasmaT1'] = { id:'plasmaT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:75000    }, { id:'gem',      count:68000    }, { id:'silicon',   count:59000  }], outputs:[{ id:'plasma', count:1    }], inputs:[{ id:'energy', count:1000   }, { id:'hydrogen', count:10   }],                                notifs:['plasmaPane'], }
            state.data['plasmaT2'] = { id:'plasmaT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:810000   }, { id:'silicon',  count:720000   }, { id:'meteorite', count:970    }], outputs:[{ id:'plasma', count:13   }], inputs:[{ id:'energy', count:8500   }, { id:'helium',   count:85   }],                                notifs:['plasmaPane'], }
            state.data['plasmaT3'] = { id:'plasmaT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:6200000  }, { id:'silicon',  count:5900000  }, { id:'meteorite', count:12100  }], outputs:[{ id:'plasma', count:160  }], inputs:[{ id:'energy', count:71000  }, { id:'helium',   count:750  }, { id:'hydrogen', count:650  }], notifs:['plasmaPane'], }
            state.data['plasmaT4'] = { id:'plasmaT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'carbon',   count:51000000 }, { id:'silicon',  count:44000000 }, { id:'meteorite', count:147000 }], outputs:[{ id:'plasma', count:2000 }], inputs:[{ id:'energy', count:600000 }, { id:'helium',   count:5800 }, { id:'hydrogen', count:6000 }], notifs:['plasmaPane'], }
            /*----------------------------------------------------------------*/
            state.data['plasmaS1'] = { id:'plasmaS1', unlocked:false, count:0, storage:{ id:'plasma', type:'FIXED', count:50000    }, costType:'EXPONENTIAL', baseCosts:[{ id:'silver', count:770000     }, { id:'gold', count:770000     }, { id:'uranium', count:550000    }], notifs:['plasmaPane'], }
            state.data['plasmaS2'] = { id:'plasmaS2', unlocked:false, count:0, storage:{ id:'plasma', type:'FIXED', count:500000   }, costType:'EXPONENTIAL', baseCosts:[{ id:'silver', count:9300000    }, { id:'gold', count:9300000    }, { id:'uranium', count:6800000   }], notifs:['plasmaPane'], }
            state.data['plasmaS3'] = { id:'plasmaS3', unlocked:false, count:0, storage:{ id:'plasma', type:'FIXED', count:5000000  }, costType:'EXPONENTIAL', baseCosts:[{ id:'silver', count:111600000  }, { id:'gold', count:111600000  }, { id:'uranium', count:81600000  }], notifs:['plasmaPane'], }
            state.data['plasmaS4'] = { id:'plasmaS4', unlocked:false, count:0, storage:{ id:'plasma', type:'FIXED', count:50000000 }, costType:'EXPONENTIAL', baseCosts:[{ id:'silver', count:1339200000 }, { id:'gold', count:1339200000 }, { id:'uranium', count:979200000 }], notifs:['plasmaPane'], }
            /*----------------------------------------------------------------*/
            
            // METEORITE
            /*----------------------------------------------------------------*/
            state.data['meteorite'] = { id:'meteorite', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, toggle:'on', costType:'FIXED', baseCosts:[{ id:'plasma', count:3 }], notifs:['meteoritePane'], }
            /*----------------------------------------------------------------*/
            state.data['meteoriteS1'] = { id:'meteoriteS1', unlocked:false, count:0, storage:{ id:'meteorite', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'meteorite', count:50 }, { id:'lunarite', count:4 }], notifs:['meteoritePane'], }
            /*----------------------------------------------------------------*/
            state.data['meteoriteT1'] = { id:'meteoriteT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:100000   }, { id:'silicon', count:60000    }],                                   outputs:[{ id:'meteorite', count:1   }], inputs:[{ id:'plasma', count:3   }], notifs:['meteoritePane'], }
            state.data['meteoriteT2'] = { id:'meteoriteT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:940000   }, { id:'uranium', count:490000   }, { id:'silicon', count:510000   }], outputs:[{ id:'meteorite', count:8   }], inputs:[{ id:'plasma', count:21  }], notifs:['meteoritePane'], }
            state.data['meteoriteT3'] = { id:'meteoriteT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'silicon',  count:3230000  }, { id:'silver',  count:5890000  }, { id:'gem',     count:8340000  }], outputs:[{ id:'meteorite', count:72  }], inputs:[{ id:'plasma', count:111 }], notifs:['meteoritePane'], }
            state.data['meteoriteT4'] = { id:'meteoriteT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:25800000 }, { id:'lava',    count:19700000 }, { id:'gold',    count:21900000 }], outputs:[{ id:'meteorite', count:142 }], inputs:[{ id:'plasma', count:135 }], notifs:['meteoritePane'], }
            /*----------------------------------------------------------------*/
            
            // CARBON
            /*----------------------------------------------------------------*/
            state.data['carbon'] = { id:'carbon', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, toggle:'on', costType:'FIXED', baseCosts:[{ id:'wood', count:2 }], notifs:['carbonPane'], }
            /*----------------------------------------------------------------*/
            state.data['carbonS1'] = { id:'carbonS1', unlocked:false, count:0, storage:{ id:'carbon', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'carbon', count:50 }, { id:'metal', count:20 }], notifs:['carbonPane'], }
            /*----------------------------------------------------------------*/
            state.data['carbonT1'] = { id:'carbonT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:10     }, { id:'wood', count:5      }],                                   outputs:[{ id:'carbon', count:1    }], inputs:[{ id:'wood',   count:2   }],                                                     notifs:['carbonPane'], }
            state.data['carbonT2'] = { id:'carbonT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:80     }, { id:'wood', count:40     }, { id:'oil',       count:100    }], outputs:[{ id:'carbon', count:4    }], inputs:[{ id:'energy', count:3   }, { id:'wood', count:6   }],                           notifs:['carbonPane'], }
            state.data['carbonT3'] = { id:'carbonT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:3500   }, { id:'gem',  count:6200   }, { id:'silicon',   count:3800   }], outputs:[{ id:'carbon', count:53   }], inputs:[{ id:'energy', count:13  }, { id:'wood', count:56  }, { id:'lava',   count:2 }], notifs:['carbonPane'], }
            state.data['carbonT4'] = { id:'carbonT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:15800  }, { id:'lava', count:12500  }, { id:'meteorite', count:560    }], outputs:[{ id:'carbon', count:210  }], inputs:[{ id:'energy', count:34  }, { id:'wood', count:148 }, { id:'plasma', count:1 }], notifs:['carbonPane'], }
            state.data['carbonT5'] = { id:'carbonT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:133000 }, { id:'wood', count:189000 }, { id:'lava',      count:160000 }], outputs:[{ id:'carbon', count:2267 }], inputs:[{ id:'energy', count:187 }, { id:'wood', count:950 }],                           notifs:['carbonPane'], }
            /*----------------------------------------------------------------*/
            
            // OIL
            /*----------------------------------------------------------------*/
            state.data['oil'] = { id:'oil', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['oilPane'], }
            /*----------------------------------------------------------------*/
            state.data['oilS1'] = { id:'oilS1', unlocked:false, count:0, storage:{ id:'oil', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'oil', count:50 }, { id:'metal', count:20 }], notifs:['oilPane'], }
            /*----------------------------------------------------------------*/
            state.data['oilT1'] = { id:'oilT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:60     }, { id:'gem',      count:20    }],                                   outputs:[{ id:'oil', count:1    }],                                      notifs:['oilPane'], }
            state.data['oilT2'] = { id:'oilT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:250    }, { id:'gem',      count:80    }, { id:'oil',       count:50     }], outputs:[{ id:'oil', count:10   }], inputs:[{ id:'energy', count:4   }], notifs:['oilPane'], }
            state.data['oilT3'] = { id:'oilT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:2400   }, { id:'titanium', count:2700  }, { id:'silicon',   count:3900   }], outputs:[{ id:'oil', count:127  }], inputs:[{ id:'energy', count:17  }], notifs:['oilPane'], }
            state.data['oilT4'] = { id:'oilT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:19400  }, { id:'titanium', count:16800 }, { id:'meteorite', count:760    }], outputs:[{ id:'oil', count:498  }], inputs:[{ id:'energy', count:44  }], notifs:['oilPane'], }
            state.data['oilT5'] = { id:'oilT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'uranium',  count:110000 }, { id:'carbon',   count:96000 }, { id:'lava',      count:167000 }], outputs:[{ id:'oil', count:4444 }], inputs:[{ id:'energy', count:258 }], notifs:['oilPane'], }
            /*----------------------------------------------------------------*/
            
            // METAL
            /*----------------------------------------------------------------*/
            state.data['metal'] = { id:'metal', unlocked:true, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['metalPane'], }
            /*----------------------------------------------------------------*/
            state.data['metalS1'] = { id:'metalS1', unlocked:false, count:0, storage:{ id:'metal', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'metal', count:50 }], notifs:['metalPane'], }
            /*----------------------------------------------------------------*/
            state.data['metalT1'] = { id:'metalT1', unlocked:true,  count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:10     }, { id:'wood', count:5      }],                                   outputs:[{ id:'metal', count:1    }],                                      notifs:['metalPane'], unlocks:['science', 'achScience', 'scienceT1', 'achScienceT1', 'techStorage', 'techEnergy1'], }
            state.data['metalT2'] = { id:'metalT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:160    }, { id:'gem',  count:60     }, { id:'oil',       count:50     }], outputs:[{ id:'metal', count:8    }], inputs:[{ id:'energy', count:2   }], notifs:['metalPane'], }
            state.data['metalT3'] = { id:'metalT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:2800   }, { id:'gem',  count:3400   }, { id:'silicon',   count:4100   }], outputs:[{ id:'metal', count:108  }], inputs:[{ id:'energy', count:9   }], notifs:['metalPane'], }
            state.data['metalT4'] = { id:'metalT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:29000  }, { id:'gold', count:18700  }, { id:'meteorite', count:900    }], outputs:[{ id:'metal', count:427  }], inputs:[{ id:'energy', count:24  }], notifs:['metalPane'], }
            state.data['metalT5'] = { id:'metalT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'titanium', count:184000 }, { id:'gold', count:133000 }, { id:'oil',       count:170000 }], outputs:[{ id:'metal', count:4768 }], inputs:[{ id:'energy', count:131 }], notifs:['metalPane'], }
            /*----------------------------------------------------------------*/
            
            // GEM
            /*----------------------------------------------------------------*/
            state.data['gem'] = { id:'gem', unlocked:true, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['gemPane'], }
            /*----------------------------------------------------------------*/
            state.data['gemS1'] = { id:'gemS1', unlocked:false, count:0, storage:{ id:'gem', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'gem', count:50 }, { id:'metal', count:20 }], notifs:['gemPane'], }
            /*----------------------------------------------------------------*/
            state.data['gemT1'] = { id:'gemT1', unlocked:true,  count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:15     }, { id:'gem',    count:10     }],                                  outputs:[{ id:'gem', count:1    }],                                      notifs:['gemPane'], }
            state.data['gemT2'] = { id:'gemT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:120    }, { id:'gem',    count:200    }, { id:'oil',       count:60    }], outputs:[{ id:'gem', count:4    }], inputs:[{ id:'energy', count:2   }], notifs:['gemPane'], }
            state.data['gemT3'] = { id:'gemT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:3400   }, { id:'gem',    count:8000   }, { id:'silicon',   count:4500  }], outputs:[{ id:'gem', count:89   }], inputs:[{ id:'energy', count:15  }], notifs:['gemPane'], }
            state.data['gemT4'] = { id:'gemT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:21000  }, { id:'gem',    count:27000  }, { id:'meteorite', count:800   }], outputs:[{ id:'gem', count:358  }], inputs:[{ id:'energy', count:40  }], notifs:['gemPane'], }
            state.data['gemT5'] = { id:'gemT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'uranium',  count:181000 }, { id:'carbon', count:185000 }, { id:'meteorite', count:12500 }], outputs:[{ id:'gem', count:3747 }], inputs:[{ id:'energy', count:260 }], notifs:['gemPane'], }
            /*----------------------------------------------------------------*/
            
            // WOOD
            /*----------------------------------------------------------------*/
            state.data['wood'] = { id:'wood', unlocked:true, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['woodPane'], }
            /*----------------------------------------------------------------*/
            state.data['woodS1'] = { id:'woodS1', unlocked:false, count:0, storage:{ id:'wood', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'wood', count:50 }, { id:'metal', count:20 }], notifs:['woodPane'], }
            /*----------------------------------------------------------------*/
            state.data['woodT1'] = { id:'woodT1', unlocked:true,  count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:10     }, { id:'wood',     count:5      }],                                   outputs:[{ id:'wood', count:1    }],                                      notifs:['woodPane'], }
            state.data['woodT2'] = { id:'woodT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:50     }, { id:'gem',      count:90     }, { id:'oil',       count:40     }], outputs:[{ id:'wood', count:6    }], inputs:[{ id:'energy', count:4   }], notifs:['woodPane'], }
            state.data['woodT3'] = { id:'woodT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:3000   }, { id:'titanium', count:2700   }, { id:'silicon',   count:2500   }], outputs:[{ id:'wood', count:74   }], inputs:[{ id:'energy', count:16  }], notifs:['woodPane'], }
            state.data['woodT4'] = { id:'woodT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:16000  }, { id:'oil',      count:31200  }, { id:'meteorite', count:490    }], outputs:[{ id:'wood', count:297  }], inputs:[{ id:'energy', count:43  }], notifs:['woodPane'], }
            state.data['woodT5'] = { id:'woodT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:122000 }, { id:'gem',      count:151000 }, { id:'hydrogen',  count:183000 }], outputs:[{ id:'wood', count:3278 }], inputs:[{ id:'energy', count:244 }], notifs:['woodPane'], }
            /*----------------------------------------------------------------*/
            
            // SILICON
            /*----------------------------------------------------------------*/
            state.data['silicon'] = { id:'silicon', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['siliconPane'], }
            /*----------------------------------------------------------------*/
            state.data['siliconS1'] = { id:'siliconS1', unlocked:false, count:0, storage:{ id:'silicon', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'silicon', count:50 }, { id:'lunarite', count:20 }], notifs:['siliconPane'], }
            /*----------------------------------------------------------------*/
            state.data['siliconT1'] = { id:'siliconT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:150    }, { id:'titanium', count:30     }],                                  outputs:[{ id:'silicon', count:1    }],                                      notifs:['siliconPane'], }
            state.data['siliconT2'] = { id:'siliconT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:500    }, { id:'gem',      count:1200   }, { id:'oil',       count:1600  }], outputs:[{ id:'silicon', count:9    }], inputs:[{ id:'energy', count:18  }], notifs:['siliconPane'], }
            state.data['siliconT3'] = { id:'siliconT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:3000   }, { id:'gem',      count:8300   }, { id:'silver',    count:2400  }], outputs:[{ id:'silicon', count:40   }], inputs:[{ id:'energy', count:53  }], notifs:['siliconPane'], }
            state.data['siliconT4'] = { id:'siliconT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:20000  }, { id:'silicon',  count:17700  }, { id:'meteorite', count:400   }], outputs:[{ id:'silicon', count:157  }], inputs:[{ id:'energy', count:138 }], notifs:['siliconPane'], }
            state.data['siliconT5'] = { id:'siliconT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'titanium', count:204000 }, { id:'wood',     count:205000 }, { id:'meteorite', count:17800 }], outputs:[{ id:'silicon', count:1487 }], inputs:[{ id:'energy', count:746 }], notifs:['siliconPane'], }
            /*----------------------------------------------------------------*/
            
            // URANIUM
            /*----------------------------------------------------------------*/
            state.data['uranium'] = { id:'uranium', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['uraniumPane'], }
            /*----------------------------------------------------------------*/
            state.data['uraniumS1'] = { id:'uraniumS1', unlocked:false, count:0, storage:{ id:'uranium', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'uranium', count:50 }, { id:'lunarite', count:20 }], notifs:['uraniumPane'], }
            /*----------------------------------------------------------------*/
            state.data['uraniumT1'] = { id:'uraniumT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:4000   }, { id:'titanium', count:2000   }, { id:'gold',      count:2000   }], outputs:[{ id:'uranium', count:1    }],                                       notifs:['uraniumPane'], }
            state.data['uraniumT2'] = { id:'uraniumT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:10000  }, { id:'uranium',  count:80     }, { id:'oil',       count:10000  }], outputs:[{ id:'uranium', count:9    }], inputs:[{ id:'energy', count:40   }], notifs:['uraniumPane'], }
            state.data['uraniumT3'] = { id:'uraniumT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:21700  }, { id:'titanium', count:23000  }, { id:'silicon',   count:13500  }], outputs:[{ id:'uranium', count:61   }], inputs:[{ id:'energy', count:180  }], notifs:['uraniumPane'], }
            state.data['uraniumT4'] = { id:'uraniumT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:93100  }, { id:'methane',  count:47000  }, { id:'meteorite', count:830    }], outputs:[{ id:'uranium', count:235  }], inputs:[{ id:'energy', count:436  }], notifs:['uraniumPane'], }
            state.data['uraniumT5'] = { id:'uraniumT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'titanium', count:486000 }, { id:'silicon',  count:266000 }, { id:'ice',       count:364000 }], outputs:[{ id:'uranium', count:2412 }], inputs:[{ id:'energy', count:2719 }], notifs:['uraniumPane'], }
            /*----------------------------------------------------------------*/
            
            // LAVA
            /*----------------------------------------------------------------*/
            state.data['lava'] = { id:'lava', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['lavaPane'], }
            /*----------------------------------------------------------------*/
            state.data['lavaS1'] = { id:'lavaS1', unlocked:false, count:0, storage:{ id:'lava', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'lava', count:50 }, { id:'lunarite', count:20 }], notifs:['lavaPane'], }
            /*----------------------------------------------------------------*/
            state.data['lavaT1'] = { id:'lavaT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:4000   }, { id:'gem',      count:7000   }],                                   outputs:[{ id:'lava', count:1    }],                                       notifs:['lavaPane'], }
            state.data['lavaT2'] = { id:'lavaT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:16000  }, { id:'titanium', count:14000  }, { id:'silicon',   count:6000   }], outputs:[{ id:'lava', count:7    }], inputs:[{ id:'energy', count:58   }], notifs:['lavaPane'], }
            state.data['lavaT3'] = { id:'lavaT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:69000  }, { id:'titanium', count:57000  }, { id:'silicon',   count:39000  }], outputs:[{ id:'lava', count:43   }], inputs:[{ id:'energy', count:237  }], notifs:['lavaPane'], }
            state.data['lavaT4'] = { id:'lavaT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:298000 }, { id:'gold',     count:121000 }, { id:'meteorite', count:750    }], outputs:[{ id:'lava', count:187  }], inputs:[{ id:'energy', count:689  }], notifs:['lavaPane'], }
            state.data['lavaT5'] = { id:'lavaT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:288000 }, { id:'gem',      count:210000 }, { id:'ice',       count:238000 }], outputs:[{ id:'lava', count:2103 }], inputs:[{ id:'energy', count:4142 }], notifs:['lavaPane'], }
            /*----------------------------------------------------------------*/
            
            // LUNARITE
            /*----------------------------------------------------------------*/
            state.data['lunarite'] = { id:'lunarite', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['lunaritePane'], }
            /*----------------------------------------------------------------*/
            state.data['lunariteS1'] = { id:'lunariteS1', unlocked:false, count:0, storage:{ id:'lunarite', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'lunarite', count:50 }, { id:'metal', count:400 }], notifs:['lunaritePane'], }
            /*----------------------------------------------------------------*/
            state.data['lunariteT1'] = { id:'lunariteT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'gem',      count:500    }],                                                                outputs:[{ id:'lunarite', count:1    }],                                       notifs:['lunaritePane'], }
            state.data['lunariteT2'] = { id:'lunariteT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:1000   }, { id:'gem',  count:600    }, { id:'oil',       count:400    }], outputs:[{ id:'lunarite', count:10   }], inputs:[{ id:'energy', count:20   }], notifs:['lunaritePane'], }
            state.data['lunariteT3'] = { id:'lunariteT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:8000   }, { id:'gem',  count:5000   }, { id:'silicon',   count:3500   }], outputs:[{ id:'lunarite', count:53   }], inputs:[{ id:'energy', count:70   }], notifs:['lunaritePane'], }
            state.data['lunariteT4'] = { id:'lunariteT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'titanium', count:45000  }, { id:'ice',  count:37000  }, { id:'meteorite', count:500    }], outputs:[{ id:'lunarite', count:207  }], inputs:[{ id:'energy', count:182  }], notifs:['lunaritePane'], }
            state.data['lunariteT5'] = { id:'lunariteT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'titanium', count:204000 }, { id:'gold', count:150000 }, { id:'methane',   count:195000 }], outputs:[{ id:'lunarite', count:2122 }], inputs:[{ id:'energy', count:1216 }], notifs:['lunaritePane'], }
            /*----------------------------------------------------------------*/
            
            // METHANE
            /*----------------------------------------------------------------*/
            state.data['methane'] = { id:'methane', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['methanePane'], }
            /*----------------------------------------------------------------*/
            state.data['methaneS1'] = { id:'methaneS1', unlocked:false, count:0, storage:{ id:'methane', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'methane', count:50 }, { id:'lunarite', count:20  }], notifs:['methanePane'], }
            /*----------------------------------------------------------------*/
            state.data['methaneT1'] = { id:'methaneT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:50     }],                                                                    outputs:[{ id:'methane', count:1    }],                                      notifs:['methanePane'], }
            state.data['methaneT2'] = { id:'methaneT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:100    }, { id:'gem',      count:800    }, { id:'oil',       count:600    }], outputs:[{ id:'methane', count:8    }], inputs:[{ id:'energy', count:16  }], notifs:['methanePane'], }
            state.data['methaneT3'] = { id:'methaneT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:10000  }, { id:'titanium', count:9000   }, { id:'silicon',   count:4100   }], outputs:[{ id:'methane', count:37   }], inputs:[{ id:'energy', count:49  }], notifs:['methanePane'], }
            state.data['methaneT4'] = { id:'methaneT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:52000  }, { id:'helium',   count:47000  }, { id:'meteorite', count:390    }], outputs:[{ id:'methane', count:149  }], inputs:[{ id:'energy', count:132 }], notifs:['methanePane'], }
            state.data['methaneT5'] = { id:'methaneT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:140000 }, { id:'gold',     count:202000 }, { id:'hydrogen',  count:158000 }], outputs:[{ id:'methane', count:1393 }], inputs:[{ id:'energy', count:899 }], notifs:['methanePane'], }
            /*----------------------------------------------------------------*/
            
            // TITANIUM
            /*----------------------------------------------------------------*/
            state.data['titanium'] = { id:'titanium', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['titaniumPane'], }
            /*----------------------------------------------------------------*/
            state.data['titaniumS1'] = { id:'titaniumS1', unlocked:false, count:0, storage:{ id:'titanium', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'titanium', count:50 }, { id:'lunarite', count:20 }], notifs:['titaniumPane'], }
            /*----------------------------------------------------------------*/
            state.data['titaniumT1'] = { id:'titaniumT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'gem',      count:1000   }],                                                                outputs:[{ id:'titanium', count:1    }],                                      notifs:['titaniumPane'], }
            state.data['titaniumT2'] = { id:'titaniumT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:200    }, { id:'gem',  count:800    }, { id:'oil',       count:1000   }], outputs:[{ id:'titanium', count:9    }], inputs:[{ id:'energy', count:13  }], notifs:['titaniumPane'], }
            state.data['titaniumT3'] = { id:'titaniumT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:14000  }, { id:'gem',  count:11000  }, { id:'silicon',   count:5600   }], outputs:[{ id:'titanium', count:49   }], inputs:[{ id:'energy', count:46  }], notifs:['titaniumPane'], }
            state.data['titaniumT4'] = { id:'titaniumT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:63000  }, { id:'gold', count:27000  }, { id:'meteorite', count:600    }], outputs:[{ id:'titanium', count:197  }], inputs:[{ id:'energy', count:123 }], notifs:['titaniumPane'], }
            state.data['titaniumT5'] = { id:'titaniumT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'uranium',  count:175000 }, { id:'wood', count:164000 }, { id:'helium',    count:156000 }], outputs:[{ id:'titanium', count:2106 }], inputs:[{ id:'energy', count:690 }], notifs:['titaniumPane'], }
            /*----------------------------------------------------------------*/
            
            // GOLD
            /*----------------------------------------------------------------*/
            state.data['gold'] = { id:'gold', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['goldPane'], }
            /*----------------------------------------------------------------*/
            state.data['goldS1'] = { id:'goldS1', unlocked:false, count:0, storage:{ id:'gold', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'gold', count:50 }, { id:'lunarite', count:20 }], notifs:['goldPane'], }
            /*----------------------------------------------------------------*/
            state.data['goldT1'] = { id:'goldT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'gem',      count:200    }, { id:'methane', count:50     }],                                  outputs:[{ id:'gold', count:1    }],                                       notifs:['goldPane'], }
            state.data['goldT2'] = { id:'goldT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:500    }, { id:'gem',     count:1500   }, { id:'oil',       count:1000  }], outputs:[{ id:'gold', count:8    }], inputs:[{ id:'energy', count:19   }], notifs:['goldPane'], }
            state.data['goldT3'] = { id:'goldT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:17000  }, { id:'silver',  count:11500  }, { id:'silicon',   count:8200  }], outputs:[{ id:'gold', count:51   }], inputs:[{ id:'energy', count:81   }], notifs:['goldPane'], }
            state.data['goldT4'] = { id:'goldT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:61000  }, { id:'helium',  count:15700  }, { id:'meteorite', count:600   }], outputs:[{ id:'gold', count:211  }], inputs:[{ id:'energy', count:223  }], notifs:['goldPane'], }
            state.data['goldT5'] = { id:'goldT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:208000 }, { id:'silver',  count:167000 }, { id:'meteorite', count:18000 }], outputs:[{ id:'gold', count:2422 }], inputs:[{ id:'energy', count:1324 }], notifs:['goldPane'], }
            /*----------------------------------------------------------------*/
            
            // SILVER
            /*----------------------------------------------------------------*/
            state.data['silver'] = { id:'silver', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['silverPane'], }
            /*----------------------------------------------------------------*/
            state.data['silverS1'] = { id:'silverS1', unlocked:false, count:0, storage:{ id:'silver', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'silver', count:50 }, { id:'lunarite', count:20 }], notifs:['silverPane'], }
            /*----------------------------------------------------------------*/
            state.data['silverT1'] = { id:'silverT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:100    }, { id:'titanium', count:20     }],                                   outputs:[{ id:'silver', count:1    }],                                       notifs:['silverPane'], }
            state.data['silverT2'] = { id:'silverT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:350    }, { id:'gem',      count:900    }, { id:'oil',       count:1200   }], outputs:[{ id:'silver', count:13   }], inputs:[{ id:'energy', count:24   }], notifs:['silverPane'], }
            state.data['silverT3'] = { id:'silverT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:19500  }, { id:'silver',   count:18200  }, { id:'silicon',   count:11000  }], outputs:[{ id:'silver', count:53   }], inputs:[{ id:'energy', count:65   }], notifs:['silverPane'], }
            state.data['silverT4'] = { id:'silverT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:85100  }, { id:'oil',      count:93800  }, { id:'meteorite', count:520    }], outputs:[{ id:'silver', count:208  }], inputs:[{ id:'energy', count:170  }], notifs:['silverPane'], }
            state.data['silverT5'] = { id:'silverT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'uranium',  count:165000 }, { id:'gem',      count:209000 }, { id:'methane',   count:170000 }], outputs:[{ id:'silver', count:2261 }], inputs:[{ id:'energy', count:1008 }], notifs:['silverPane'], }
            /*----------------------------------------------------------------*/
            
            // HYDROGEN
            /*----------------------------------------------------------------*/
            state.data['hydrogen'] = { id:'hydrogen', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['hydrogenPane'], }
            /*----------------------------------------------------------------*/
            state.data['hydrogenS1'] = { id:'hydrogenS1',  unlocked:false, count:0, storage:{ id:'hydrogen', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'hydrogen', count:50 }, { id:'lunarite', count:20 }], notifs:['hydrogenPane'], }
            /*----------------------------------------------------------------*/
            state.data['hydrogenT1'] = { id:'hydrogenT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:6000   }, { id:'titanium', count:4800   }],                                   outputs:[{ id:'hydrogen', count:1    }],                                       notifs:['hydrogenPane'], }
            state.data['hydrogenT2'] = { id:'hydrogenT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:10800  }, { id:'titanium', count:9600   }, { id:'silicon',   count:6600   }], outputs:[{ id:'hydrogen', count:5    }], inputs:[{ id:'energy', count:63   }], notifs:['hydrogenPane'], }
            state.data['hydrogenT3'] = { id:'hydrogenT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'silver',   count:37200  }, { id:'gold',     count:34200  }, { id:'silicon',   count:25800  }], outputs:[{ id:'hydrogen', count:28   }], inputs:[{ id:'energy', count:234  }], notifs:['hydrogenPane'], }
            state.data['hydrogenT4'] = { id:'hydrogenT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:172000 }, { id:'methane',  count:134000 }, { id:'meteorite', count:710    }], outputs:[{ id:'hydrogen', count:113  }], inputs:[{ id:'energy', count:613  }], notifs:['hydrogenPane'], }
            state.data['hydrogenT5'] = { id:'hydrogenT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:250000 }, { id:'wood',     count:184000 }, { id:'oil',       count:146000 }], outputs:[{ id:'hydrogen', count:3562 }], inputs:[{ id:'energy', count:4581 }], notifs:['hydrogenPane'], }
            /*----------------------------------------------------------------*/
            
            // HELIUM
            /*----------------------------------------------------------------*/
            state.data['helium'] = { id:'helium', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['heliumPane'], }
            /*----------------------------------------------------------------*/
            state.data['heliumS1'] = { id:'heliumS1', unlocked:false, count:0, storage:{ id:'helium', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'helium', count:50 }, { id:'lunarite', count:20 }], notifs:['heliumPane'], }
            /*----------------------------------------------------------------*/
            state.data['heliumT1'] = { id:'heliumT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:8400   }, { id:'titanium', count:6000   }],                                  outputs:[{ id:'helium', count:1    }],                                       notifs:['heliumPane'], }
            state.data['heliumT2'] = { id:'heliumT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:12600  }, { id:'titanium', count:10200  }, { id:'silicon',   count:8400  }], outputs:[{ id:'helium', count:11   }], inputs:[{ id:'energy', count:72   }], notifs:['heliumPane'], }
            state.data['heliumT3'] = { id:'heliumT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:63000  }, { id:'titanium', count:43800  }, { id:'silicon',   count:35400 }], outputs:[{ id:'helium', count:57   }], inputs:[{ id:'energy', count:248  }], notifs:['heliumPane'], }
            state.data['heliumT4'] = { id:'heliumT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:255000 }, { id:'titanium', count:173000 }, { id:'meteorite', count:770   }], outputs:[{ id:'helium', count:232  }], inputs:[{ id:'energy', count:670  }], notifs:['heliumPane'], }
            state.data['heliumT5'] = { id:'heliumT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:171000 }, { id:'silicon',  count:165000 }, { id:'meteorite', count:18600 }], outputs:[{ id:'helium', count:2369 }], inputs:[{ id:'energy', count:4075 }], notifs:['heliumPane'], }
            /*----------------------------------------------------------------*/
            
            // ICE
            /*----------------------------------------------------------------*/
            state.data['ice'] = { id:'ice', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, gain:1, baseStorage:50, notifs:['icePane'], }
            /*----------------------------------------------------------------*/
            state.data['iceS1'] = { id:'iceS1', unlocked:false, count:0, storage:{ id:'ice', type:'DOUBLE' }, costType:'DOUBLE', baseCosts:[{ id:'ice', count:50 }, { id:'lunarite', count:20 }], notifs:['icePane'], }
            /*----------------------------------------------------------------*/
            state.data['iceT1'] = { id:'iceT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:17800  }, { id:'gem',      count:19300  }],                                   outputs:[{ id:'ice', count:1    }],                                       notifs:['icePane'], }
            state.data['iceT2'] = { id:'iceT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:23900  }, { id:'titanium', count:21200  }, { id:'silicon',   count:19600  }], outputs:[{ id:'ice', count:9    }], inputs:[{ id:'energy', count:83   }], notifs:['icePane'], }
            state.data['iceT3'] = { id:'iceT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:117000 }, { id:'titanium', count:86000  }, { id:'silicon',   count:73000  }], outputs:[{ id:'ice', count:65   }], inputs:[{ id:'energy', count:397  }], notifs:['icePane'], }
            state.data['iceT4'] = { id:'iceT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'wood',     count:379000 }, { id:'helium',   count:14000  }, { id:'meteorite', count:1500   }], outputs:[{ id:'ice', count:278  }], inputs:[{ id:'energy', count:1135 }], notifs:['icePane'], }
            state.data['iceT5'] = { id:'iceT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:210000 }, { id:'silver',   count:188000 }, { id:'helium',    count:205000 }], outputs:[{ id:'ice', count:2973 }], inputs:[{ id:'energy', count:7397 }], notifs:['icePane'], }
            /*----------------------------------------------------------------*/
            
            // SCIENCE
            /*----------------------------------------------------------------*/
            state.data['science'] = { id:'science', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, notifs:['sciencePane', 'helpPane'], }
            /*----------------------------------------------------------------*/
            state.data['scienceT1'] = { id:'scienceT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal', count:20       }, { id:'gem', count:15      }, { id:'wood', count:10       }], outputs:[{ id:'science', count:0.1  }], notifs:['sciencePane'], }
            state.data['scienceT2'] = { id:'scienceT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal', count:1000     }, { id:'gem', count:200     }, { id:'wood', count:500      }], outputs:[{ id:'science', count:1    }], notifs:['sciencePane'], }
            state.data['scienceT3'] = { id:'scienceT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal', count:17000    }, { id:'gem', count:4700    }, { id:'wood', count:9600     }], outputs:[{ id:'science', count:10   }], notifs:['sciencePane'], }
            state.data['scienceT4'] = { id:'scienceT4', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal', count:610000   }, { id:'gem', count:370000  }, { id:'wood', count:926000   }], outputs:[{ id:'science', count:100  }], notifs:['sciencePane'], }
            state.data['scienceT5'] = { id:'scienceT5', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal', count:12400000 }, { id:'gem', count:7300000 }, { id:'wood', count:15900000 }], outputs:[{ id:'science', count:1000 }], notifs:['sciencePane'], }
            /*----------------------------------------------------------------*/
            
            // TECHS
            /*----------------------------------------------------------------*/
            state.data['techStorage'] =        { id:'techStorage',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:5        }], notifs:['technologiesPane'], unlocks:['meteoriteS1', 'carbonS1', 'oilS1', 'metalS1', 'gemS1', 'woodS1', 'siliconS1', 'uraniumS1', 'lavaS1', 'lunariteS1', 'methaneS1', 'titaniumS1', 'goldS1', 'silverS1', 'hydrogenS1', 'heliumS1', 'iceS1', 'techOil'], }
            state.data['techEnergy1'] =        { id:'techEnergy1',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:20       }], notifs:['technologiesPane'], unlocks:['energy', 'energyT1', 'achEnergyT1', 'carbon', 'achCarbon', 'carbonT1', 'achCarbonT1', 'techEnergy2', 'techTier2', 'upgradeEnergy1'], }
            state.data['techOil'] =            { id:'techOil',            unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:30       }], notifs:['technologiesPane'], unlocks:['oil', 'achOil', 'oilT1', 'achOilT1'], }
            state.data['techEnergy2'] =        { id:'techEnergy2',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:50       }], notifs:['technologiesPane'], unlocks:['energyT2', 'achEnergyT2', 'upgradeEnergy2'], }
            state.data['techTier2'] =          { id:'techTier2',          unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:100      }], notifs:['technologiesPane'], unlocks:['carbonT2', 'achCarbonT2', 'oilT2', 'achOilT2', 'metalT2', 'achMetalT2', 'gemT2', 'achGemT2', 'woodT2', 'achWoodT2', 'siliconT2', 'achSiliconT2', 'uraniumT2', 'achUraniumT2', 'lavaT2', 'achLavaT2', 'lunariteT2', 'achLunariteT2', 'methaneT2', 'achMethaneT2', 'titaniumT2', 'achTitaniumT2', 'goldT2', 'achGoldT2', 'silverT2', 'achSilverT2', 'hydrogenT2', 'achHydrogenT2', 'heliumT2', 'achHeliumT2', 'iceT2', 'achIceT2', 'techDestruction', 'techFuel1', 'upgradeTier2'], }
            state.data['techDestruction'] =    { id:'techDestruction',    unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:500      }], notifs:['technologiesPane'], }
            state.data['techFuel1'] =          { id:'techFuel1',          unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:500      }], notifs:['technologiesPane'], unlocks:['fuel', 'achFuel', 'fuelT1', 'achFuelT1', 'rocket1', 'techFuel2', 'techScience2'], }
            state.data['techFuel2'] =          { id:'techFuel2',          unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:450000   }], notifs:['technologiesPane'], unlocks:['fuelT2', 'achFuelT2', 'techFuel3'], }
            state.data['techFuel3'] =          { id:'techFuel3',          unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:3200000  }], notifs:['technologiesPane'], unlocks:['fuelT3', 'achFuelT3'], }
            state.data['techScience2'] =       { id:'techScience2',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:500      }], notifs:['technologiesPane'], unlocks:['scienceT2', 'achScienceT2', 'techScience3'], }
            state.data['techScience3'] =       { id:'techScience3',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:3000     }], notifs:['technologiesPane'], unlocks:['scienceT3', 'achScienceT3', 'techScience4'], }
            state.data['techScience4'] =       { id:'techScience4',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:50000000 }], notifs:['technologiesPane'], unlocks:['scienceT4', 'achScienceT4'], }
            state.data['techEnergyStorage1'] = { id:'techEnergyStorage1', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:15000    }], notifs:['technologiesPane'], unlocks:['energyS1', 'techEnergyStorage2'], }
            state.data['techEnergyStorage2'] = { id:'techEnergyStorage2', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:300000   }], notifs:['technologiesPane'], unlocks:['energyS2', 'techEnergyStorage3'], }
            state.data['techEnergyStorage3'] = { id:'techEnergyStorage3', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:3000000  }], notifs:['technologiesPane'], unlocks:['energyS3', 'techEnergyStorage4'], }
            state.data['techEnergyStorage4'] = { id:'techEnergyStorage4', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:30000000 }], notifs:['technologiesPane'], unlocks:['energyS4'], }
            state.data['techPlasma1'] =        { id:'techPlasma1',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:40000    }], notifs:['technologiesPane'], unlocks:['plasma', 'plasmaT1', 'achPlasmaT1', 'techPlasma2', 'techPlasmaStorage1'], }
            state.data['techPlasma2'] =        { id:'techPlasma2',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:60000    }], notifs:['technologiesPane'], unlocks:['plasmaT2', 'achPlasmaT2'], }
            state.data['techPlasmaStorage1'] = { id:'techPlasmaStorage1', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:9500000  }], notifs:['technologiesPane'], unlocks:['plasmaS1', 'techPlasmaStorage2'], }
            state.data['techPlasmaStorage2'] = { id:'techPlasmaStorage2', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:37000000 }], notifs:['technologiesPane'], unlocks:['plasmaS2'], }
            state.data['techEmc1'] =           { id:'techEmc1',           unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:60000    }], notifs:['technologiesPane'], unlocks:['emc', 'techMeteorite0'], }
            state.data['techMeteorite0'] =     { id:'techMeteorite0',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:100000   }], notifs:['technologiesPane'], unlocks:['meteorite', 'achMeteorite'], }
            state.data['techMeteorite1'] =     { id:'techMeteorite1',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:75000    }], notifs:['technologiesPane'], unlocks:['meteoriteT1', 'achMeteoriteT1', 'techMeteorite2'], }
            state.data['techMeteorite2'] =     { id:'techMeteorite2',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:100000   }], notifs:['technologiesPane'], unlocks:['meteoriteT2', 'achMeteoriteT2'], }
            state.data['techDyson1'] =         { id:'techDyson1',         unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:100000   }], notifs:['technologiesPane'], unlocks:['segment', 'dysonT1', 'achDysonT1', 'techDyson2'], }
            state.data['techDyson2'] =         { id:'techDyson2',         unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:500000   }], notifs:['technologiesPane'], unlocks:['dysonT2', 'achDysonT2', 'dysonT3', 'achDysonT3'], }
            state.data['techNanoswarm1'] =     { id:'techNanoswarm1',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:10000000 }], notifs:['technologiesPane'], unlocks:['nanoswarm'], }
            /*----------------------------------------------------------------*/
            state.data['upgradeTier2']   = { id:'upgradeTier2',   unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:300  }], notifs:['technologiesPane'], }
            state.data['upgradeEnergy1'] = { id:'upgradeEnergy1', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:1000 }], notifs:['technologiesPane'], }
            state.data['upgradeEnergy2'] = { id:'upgradeEnergy2', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'science', count:5000 }], notifs:['technologiesPane'], unlocks:['techEnergyStorage1'], }
            /*----------------------------------------------------------------*/
            state.data['boostProduction'] =    { id:'boostProduction',    unlocked:false, count:0,          costType:'EXPONENTIAL', baseCosts:[{ id:'science', count:100000    }], notifs:['technologiesPane'], }
            state.data['boostScience'] =       { id:'boostScience',       unlocked:false, count:0,          costType:'EXPONENTIAL', baseCosts:[{ id:'science', count:10000000  }], notifs:['technologiesPane'], }    
            state.data['boostEnergy'] =        { id:'boostEnergy',        unlocked:false, count:0, max:25,  costType:'EXPONENTIAL', baseCosts:[{ id:'science', count:10000000  }], notifs:['technologiesPane'], }    
            state.data['boostEnergyStorage'] = { id:'boostEnergyStorage', unlocked:false, count:0, max:200, costType:'EXPONENTIAL', baseCosts:[{ id:'science', count:100000000 }], notifs:['technologiesPane'], }
            /*----------------------------------------------------------------*/
            
            // FUEL
            /*----------------------------------------------------------------*/
            state.data['fuel'] = { id:'fuel', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, toggle:'on', notifs:['fuelPane'], }
            /*----------------------------------------------------------------*/
            state.data['fuelT1'] = { id:'fuelT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:1000   }, { id:'gem',     count:750   }, { id:'wood', count:500   }], outputs:[{ id:'fuel', count:0.2 }], inputs:[{ id:'carbon',  count:20  }, { id:'oil', count:20  }], notifs:['fuelPane'], }
            state.data['fuelT2'] = { id:'fuelT2', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:12000  }, { id:'gem',     count:8300  }, { id:'wood', count:6800  }], outputs:[{ id:'fuel', count:1.5 }], inputs:[{ id:'carbon',  count:100 }, { id:'oil', count:100 }], notifs:['fuelPane'], }
            state.data['fuelT3'] = { id:'fuelT3', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'titanium', count:140000 }, { id:'silicon', count:96300 }, { id:'gold', count:78600 }], outputs:[{ id:'fuel', count:20  }], inputs:[{ id:'methane', count:520 }],                          notifs:['fuelPane'], }
            /*----------------------------------------------------------------*/
            
            // ROCKET
            /*----------------------------------------------------------------*/
            state.data['rocket1'] = { id:'rocket1', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'metal', count:1200 }, { id:'gem', count:900 }, { id:'oil', count:1000 }], unlocks:['rocket2'],                                      notifs:['rocketPane'], }
            state.data['rocket2'] = { id:'rocket2', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel',  count:20   }],                                                    unlocks:['moon', 'mercury', 'venus', 'mars', 'asteroid'], notifs:['rocketPane'], }
            /*----------------------------------------------------------------*/
            
            // INNER SOLAR SYSTEM
            /*----------------------------------------------------------------*/
            state.data['moon'] =          { id:'moon',          unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:25  }], notifs:['innerSolarSystemPane'], unlocks:['lunarite', 'achLunarite', 'lunariteT1', 'achLunariteT1'], }
            state.data['mercury'] =       { id:'mercury',       unlocked:false, count:0, max:1,                                                         notifs:['innerSolarSystemPane'], }
            state.data['venus'] =         { id:'venus',         unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:100 }], notifs:['innerSolarSystemPane'], unlocks:['methane', 'achMethane', 'methaneT1', 'achMethaneT1', 'energyT3', 'achEnergyT3'], }
            state.data['mars'] =          { id:'mars',          unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:75  }], notifs:['innerSolarSystemPane'], unlocks:['titanium', 'achTitanium', 'titaniumT1', 'achTitaniumT1', 'silicon', 'achSilicon', 'siliconT1', 'achSiliconT1'], }
            state.data['asteroid'] =      { id:'asteroid',      unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:400 }], notifs:['innerSolarSystemPane'], unlocks:['gold', 'achGold', 'goldT1', 'achGoldT1', 'silver', 'achSilver', 'silverT1', 'achSilverT1', 'wonderStation'], }
            state.data['wonderStation'] = { id:'wonderStation', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:500 }], notifs:['innerSolarSystemPane'], unlocks:['jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'wonderPrecious0', 'wonderEnergetic0', 'wonderTechnological0', 'wonderMeteorite0'], }
            /*----------------------------------------------------------------*/
            
            // OUTER SOLAR SYSTEM
            /*----------------------------------------------------------------*/
            state.data['jupiter'] =    { id:'jupiter',    unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:1000 }], notifs:['outerSolarSystemPane'], unlocks:['hydrogen', 'achHydrogen', 'hydrogenT1', 'achHydrogenT1', 'energyT6', 'achEnergyT6'], }
            state.data['saturn'] =     { id:'saturn',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:2000 }], notifs:['outerSolarSystemPane'], unlocks:['helium', 'achHelium', 'heliumT1', 'achHeliumT1'], }
            state.data['uranus'] =     { id:'uranus',     unlocked:false, count:0, max:1,                                                          notifs:['outerSolarSystemPane'], }
            state.data['neptune'] =    { id:'neptune',    unlocked:false, count:0, max:1,                                                          notifs:['outerSolarSystemPane'], }
            state.data['pluto'] =      { id:'pluto',      unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:4000 }], notifs:['outerSolarSystemPane'], unlocks:['ice', 'achIce', 'iceT1', 'achIceT1', 'solCenter0'], }
            state.data['solCenter0'] = { id:'solCenter0', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:6000 }], notifs:['outerSolarSystemPane'], unlocks:['solCenter1'], }
            state.data['solCenter1'] = { id:'solCenter1', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'fuel', count:7000 }], notifs:['outerSolarSystemPane'], unlocks:['techPlasma0', 'techDyson0', 'techEmc0'], }
            /*----------------------------------------------------------------*/
            
            // WONDER STATION
            /*----------------------------------------------------------------*/
            state.data['wonderPrecious0'] =      { id:'wonderPrecious0',      unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'gem',       count:10000 }, { id:'silver', count:7500   }, { id:'gold',    count:5000    }], notifs:['wonderStationPane', 'helpPane'], unlocks:['wonderPrecious1'], }
            state.data['wonderEnergetic0'] =     { id:'wonderEnergetic0',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'wood',      count:10000 }, { id:'carbon', count:5000   }, { id:'uranium', count:200     }], notifs:['wonderStationPane'], unlocks:['wonderEnergetic1'], }
            state.data['wonderTechnological0'] = { id:'wonderTechnological0', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'silicon',   count:30000 }, { id:'gold',   count:18000  }, { id:'gem',     count:40000   }], notifs:['wonderStationPane'], unlocks:['wonderTechnological1'], }
            state.data['wonderMeteorite0'] =     { id:'wonderMeteorite0',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'meteorite', count:5000  }, { id:'ice',    count:600000 }, { id:'silicon', count:1200000 }], notifs:['wonderStationPane'], unlocks:['wonderMeteorite1'], }
            /*----------------------------------------------------------------*/
            
            // FLOOR #1
            /*----------------------------------------------------------------*/
            state.data['wonderPrecious1'] =      { id:'wonderPrecious1',      unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'gem',       count:30000 }, { id:'silver', count:20000   }, { id:'gold',    count:10000   }], notifs:['floor1Pane'], unlocks:['uranium', 'achUranium', 'uraniumT1', 'achUraniumT1', 'energyT4', 'achEnergyT4'], }
            state.data['wonderEnergetic1'] =     { id:'wonderEnergetic1',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'wood',      count:30000 }, { id:'carbon', count:15000   }, { id:'uranium', count:500     }], notifs:['floor1Pane'], unlocks:['lava', 'achLava', 'lavaT1', 'achLavaT1', 'energyT5', 'achEnergyT5'], }
            state.data['wonderTechnological1'] = { id:'wonderTechnological1', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'silicon',   count:50000 }, { id:'gold',   count:30000   }, { id:'gem',     count:60000   }], notifs:['floor1Pane'], unlocks:['carbonT3', 'achCarbonT3', 'oilT3', 'achOilT3', 'metalT3', 'achMetalT3', 'gemT3', 'achGemT3', 'woodT3', 'achWoodT3', 'siliconT3', 'achSiliconT3', 'uraniumT3', 'achUraniumT3', 'lavaT3', 'achLavaT3', 'lunariteT3', 'achLunariteT3', 'methaneT3', 'achMethaneT3', 'titaniumT3', 'achTitaniumT3', 'goldT3', 'achGoldT3', 'silverT3', 'achSilverT3', 'hydrogenT3', 'achHydrogenT3', 'heliumT3', 'achHeliumT3', 'iceT3', 'achIceT3'], }
            state.data['wonderMeteorite1'] =     { id:'wonderMeteorite1',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'meteorite', count:10000 }, { id:'ice',    count:2000000 }, { id:'silicon', count:4000000 }], notifs:['floor1Pane'], unlocks:['carbonT4', 'achCarbonT4', 'oilT4', 'achOilT4', 'metalT4', 'achMetalT4', 'gemT4', 'achGemT4', 'woodT4', 'achWoodT4', 'siliconT4', 'achSiliconT4', 'uraniumT4', 'achUraniumT4', 'lavaT4', 'achLavaT4', 'lunariteT4', 'achLunariteT4', 'methaneT4', 'achMethaneT4', 'titaniumT4', 'achTitaniumT4', 'goldT4', 'achGoldT4', 'silverT4', 'achSilverT4', 'hydrogenT4', 'achHydrogenT4', 'heliumT4', 'achHeliumT4', 'iceT4', 'achIceT4', 'wonderComm', 'wonderSpaceship', 'wonderAntimatter', 'wonderPortal', 'techMeteorite1'], }
            /*----------------------------------------------------------------*/
            
            // FLOOR #2
            /*----------------------------------------------------------------*/
            state.data['wonderComm'] =       { id:'wonderComm',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'gold',      count:6000000 }, { id:'silicon',  count:10000000 }, { id:'ice',     count:6000000  }], notifs:['floor2Pane'], unlocks:['radarT1', 'radarT2'], }
            state.data['wonderSpaceship'] =  { id:'wonderSpaceship',  unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'lunarite',  count:8000000 }, { id:'titanium', count:6000000  }, { id:'metal',   count:12000000 }], notifs:['floor2Pane'], unlocks:['spaceship', 'shield', 'engine', 'aero'], }
            state.data['wonderAntimatter'] = { id:'wonderAntimatter', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'uranium',   count:6000000 }, { id:'lava',     count:10000000 }, { id:'oil',     count:8000000  }], notifs:['floor2Pane'], unlocks:['antimatter', 'antimatterT1'], }
            state.data['wonderPortal'] =     { id:'wonderPortal',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'meteorite', count:500000  }, { id:'helium',   count:8000000  }, { id:'silicon', count:6000000  }], notifs:['floor2Pane'], unlocks:['wonderStargate'], }
            /*----------------------------------------------------------------*/
            
            // FLOOR #3
            /*----------------------------------------------------------------*/
            state.data['wonderStargate'] = { id:'wonderStargate',unlocked:false, count:0,max:1, costType:'FIXED', baseCosts:[{ id:'plasma', count:500000 }, { id:'silicon', count:920000000 }, { id:'meteorite', count:17000000 }], notifs:['floor3Pane'], unlocks:['shipT1', 'shipT2', 'shipT3', 'shipT4', 'shipT5'], }
            /*----------------------------------------------------------------*/
            
            // SOL CENTER
            /*----------------------------------------------------------------*/
            state.data['techPlasma0'] =    { id:'techPlasma0',    unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'hydrogen', count:1500   }, { id:'uranium', count:1500  }, { id:'oil', count:1500 }, { id:'wood', count:1500 }], notifs:['solCenterPane'], unlocks:['techPlasma1'], }
            state.data['techEmc0'] =       { id:'techEmc0',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'energy',   count:75000  }, { id:'plasma',  count:100   }],                                                      notifs:['solCenterPane'], unlocks:['techEmc1'], }
            state.data['techDyson0'] =     { id:'techDyson0',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'energy',   count:100000 }, { id:'plasma',  count:10000 }],                                                      notifs:['solCenterPane', 'helpPane'], unlocks:['techDyson1'], }
            /*----------------------------------------------------------------*/
            
            // EMC
            /*----------------------------------------------------------------*/
            state.data['emc'] = { id:'emc', unlocked:false, notifs:['emcPane'], }
            /*----------------------------------------------------------------*/
            state.data['emcMeteorite'] = { id:'emcMeteorite', unlocked:false, source:'plasma', resource:'meteorite', rate:3, }
            state.data['emcCarbon'] =    { id:'emcCarbon',    unlocked:false, source:'energy', resource:'carbon',    rate:2, }
            state.data['emcOil'] =       { id:'emcOil',       unlocked:false, source:'energy', resource:'oil',       rate:3, }
            state.data['emcMetal'] =     { id:'emcMetal',     unlocked:false, source:'energy', resource:'metal',     rate:1, }
            state.data['emcGem'] =       { id:'emcGem',       unlocked:false, source:'energy', resource:'gem',       rate:3, }
            state.data['emcWood'] =      { id:'emcWood',      unlocked:false, source:'energy', resource:'wood',      rate:1, }
            state.data['emcSilicon'] =   { id:'emcSilicon',   unlocked:false, source:'energy', resource:'silicon',   rate:23, }
            state.data['emcUranium'] =   { id:'emcUranium',   unlocked:false, source:'energy', resource:'uranium',   rate:37, }
            state.data['emcLava'] =      { id:'emcLava',      unlocked:false, source:'energy', resource:'lava',      rate:42, }
            state.data['emcLunarite'] =  { id:'emcLunarite',  unlocked:false, source:'energy', resource:'lunarite',  rate:15, }
            state.data['emcMethane'] =   { id:'emcMethane',   unlocked:false, source:'energy', resource:'methane',   rate:12, }
            state.data['emcTitanium'] =  { id:'emcTitanium',  unlocked:false, source:'energy', resource:'titanium',  rate:17, }
            state.data['emcGold'] =      { id:'emcGold',      unlocked:false, source:'energy', resource:'gold',      rate:14, }
            state.data['emcSilver'] =    { id:'emcSilver',    unlocked:false, source:'energy', resource:'silver',    rate:16, }
            state.data['emcHydrogen'] =  { id:'emcHydrogen',  unlocked:false, source:'energy', resource:'hydrogen',  rate:33, }
            state.data['emcHelium'] =    { id:'emcHelium',    unlocked:false, source:'energy', resource:'helium',    rate:39, }
            state.data['emcIce'] =       { id:'emcIce',       unlocked:false, source:'energy', resource:'ice',       rate:44, }
            /*----------------------------------------------------------------*/
            
            // DYSON
            /*----------------------------------------------------------------*/
            state.data['segment'] = { id:'segment', unlocked:false, count:0,                  costType:'DYSON', baseCosts:[{ id:'titanium', count:300000 }, { id:'gold', count:100000 }, { id:'silicon', count:200000 }, { id:'meteorite', count:1000 }, { id:'ice', count:100000 }], notifs:['dysonPane', 'helpPane'], }
            state.data['dysonT1'] = { id:'dysonT1', unlocked:false, count:0, active:0,        costType:'FIXED', baseCosts:[{ id:'segment',  count:50     }, { id:'fuel', count:50000   }], outputs:[{ id:'energy', count:5000    }],                                                  notifs:['dysonPane'], }
            state.data['dysonT2'] = { id:'dysonT2', unlocked:false, count:0, active:0,        costType:'FIXED', baseCosts:[{ id:'segment',  count:100    }, { id:'fuel', count:250000  }], outputs:[{ id:'energy', count:25000   }],                                                  notifs:['dysonPane'], }
            state.data['dysonT3'] = { id:'dysonT3', unlocked:false, count:0, active:0, max:1, costType:'FIXED', baseCosts:[{ id:'segment',  count:250    }, { id:'fuel', count:1000000 }], outputs:[{ id:'energy', count:1000000 }],                                                  notifs:['dysonPane'], unlocks:['darkmatter',
                                                                                                                                                                                                                                                                                                                     'upgradeGain', 'upgradeStorage1', 'upgradeStorage2', 'techEnergyStorage6', 'upgradeStorage3',
                                                                                                                                                                                                                                                                                                                     'techPlasma3', 'upgradeWonder1', 'upgradeWonder2', 'upgradeWonder3', 'autoEmc', 'techPlasma4', 'techPlasmaStorage3',
                                                                                                                                                                                                                                                                                                                     'upgradeScience1', 'upgradeScience2', 'techScience5', 'upgradeEnergyBoost',
                                                                                                                                                                                                                                                                                                                     'upgradeTier1', 'techEnergyStorage5', 'multiBuy', 'boostCapital', 'techTier5',
                                                                                                                                                                                                                                                                                                                     'upgradeFuel1', 'upgradeSpaceship', 'techPlasmaStorage4', 'techMeteorite3', 'techMeteorite4',
                                                                                                                                                                                                                                                                                                                     'boostDarkmatter', 'upgradeFaction',
                                                                                                                                                                                                                                                                                                                     'carnelian', 'prasnian', 'hyacinite', 'kitrinos', 'moviton', 'overlord', ], }            
            /*----------------------------------------------------------------*/
            
            // NANOSWARM
            /*----------------------------------------------------------------*/
            state.data['nanoswarm'] = { id:'nanoswarm', unlocked:false, count:0, resource:null, costType:'EXPONENTIAL', baseCosts:[{ id:'carbon', count:3000000 }, { id:'gem', count:2000000 }, { id:'silver', count:2000000 }], notifs:['nanoswarmPane'], }
            /*----------------------------------------------------------------*/
            
            // ANTIMATTER
            /*----------------------------------------------------------------*/
            state.data['antimatter'] = { id:'antimatter', unlocked:false, titan:false, count:0, prod:0, production:0, consumption:0, baseStorage:100000, toggle:'on', notifs:['antimatterPane', 'helpPane'], }
            /*----------------------------------------------------------------*/
            state.data['antimatterT1'] = { id:'antimatterT1', unlocked:false, count:0, active:0, destroyable:true, costType:'EXPONENTIAL', baseCosts:[{ id:'silver', count:163000000 }, { id:'oil', count:712000000 }, { id:'meteorite', count:12300000 }], outputs:[{ id:'antimatter', count:0.5 }], inputs:[{ id:'plasma', count:100 }, { id:'ice', count:12000 }], notifs:['antimatterPane'], }
            /*----------------------------------------------------------------*/
            
            // COMMUNICATIONS
            /*----------------------------------------------------------------*/
            state.data['radarT1'] = { id:'radarT1', unlocked:false, count:0, max:1, costType:'EXPONENTIAL', baseCosts:[{ id:'metal', count:60000000000 }, { id:'ice', count:6000000000 }, { id:'meteorite', count:60000000 }], notifs:['communicationPane'], }
            state.data['radarT2'] = { id:'radarT2', unlocked:false, count:0,        costType:'EXPONENTIAL', baseCosts:[{ id:'metal', count:38600000000 }, { id:'ice', count:4320000000 }, { id:'meteorite', count:15800000 }], notifs:['communicationPane'], }
            /*----------------------------------------------------------------*/
            
            // SPACESHIP
            /*----------------------------------------------------------------*/
            state.data['spaceship'] = { id:'spaceship', unlocked:false, count:0, max:1,  costType:'FIXED',       baseCosts:[{ id:'shield',   count:50       }, { id:'engine',    count:25       }, { id:'aero',     count:15       }], notifs:['spaceshipPane'], unlocks:['carnelian', 'prasnian', 'hyacinite', 'kitrinos', 'moviton', 'overlord'], }
            state.data['shield'] =    { id:'shield',    unlocked:false, count:0, max:50, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:10000000 }, { id:'titanium',  count:10000000 }, { id:'metal',    count:10000000 }], notifs:['spaceshipPane'], }
            state.data['engine'] =    { id:'engine',    unlocked:false, count:0, max:25, costType:'EXPONENTIAL', baseCosts:[{ id:'silicon',  count:50000000 }, { id:'meteorite', count:1000000  }, { id:'hydrogen', count:25000000 }], notifs:['spaceshipPane'], }
            state.data['aero'] =      { id:'aero',      unlocked:false, count:0, max:15, costType:'EXPONENTIAL', baseCosts:[{ id:'silver',   count:20000000 }, { id:'ice',       count:30000000 }, { id:'gem',      count:25000000 }], notifs:['spaceshipPane'], }
            /*----------------------------------------------------------------*/
            
            // MILITARY
            /*----------------------------------------------------------------*/
            state.data['shipT1'] = { id:'shipT1', unlocked:false, count:0, active:0, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:870000000  }, { id:'gem',      count:420000000  }, { id:'silver',    count:390000000  }], stats:{ power:3,  defense:2,  speed:15 }, notifs:['militaryPane'], }
            state.data['shipT2'] = { id:'shipT2', unlocked:false, count:0, active:0, costType:'EXPONENTIAL', baseCosts:[{ id:'gold',     count:930000000  }, { id:'lunarite', count:6100000000 }, { id:'meteorite', count:13000000   }], stats:{ power:5,  defense:6,  speed:12 }, notifs:['militaryPane'], }
            state.data['shipT3'] = { id:'shipT3', unlocked:false, count:0, active:0, costType:'EXPONENTIAL', baseCosts:[{ id:'titanium', count:1620000000 }, { id:'ice',      count:1020000000 }, { id:'silicon',   count:1140000000 }], stats:{ power:8,  defense:4,  speed:10 }, notifs:['militaryPane'], }
            state.data['shipT4'] = { id:'shipT4', unlocked:false, count:0, active:0, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:4900000000 }, { id:'uranium',  count:2300000000 }, { id:'hydrogen',  count:3100000000 }], stats:{ power:15, defense:13, speed:9  }, notifs:['militaryPane'], }
            state.data['shipT5'] = { id:'shipT5', unlocked:false, count:0, active:0, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:5300000000 }, { id:'helium',   count:4600000000 }, { id:'meteorite', count:1700000000 }], stats:{ power:57, defense:62, speed:5  }, notifs:['militaryPane'], }
            /*----------------------------------------------------------------*/
            
            // TERRAFORMING
            /*----------------------------------------------------------------*/
            state.data['probe'] =       { id:'probe',       unlocked:false, count:0, costType:'EXPONENTIAL', baseCosts:[{ id:'metal',    count:435000000 },   { id:'gem',    count:210000000 },  { id:'silver',    count:145000000  }], }
            state.data['terraformer'] = { id:'terraformer', unlocked:false, count:0, costType:'EXPONENTIAL', baseCosts:[{ id:'lunarite', count:10600000000 }, { id:'helium', count:9200000000 }, { id:'meteorite', count:3400000000 }], }
            /*----------------------------------------------------------------*/
            
            // FACTIONS
            /*----------------------------------------------------------------*/
            state.data['carnelian'] = { id:'carnelian', unlocked:false, opinion:0, }
            state.data['prasnian'] =  { id:'prasnian',  unlocked:false, opinion:0, }
            state.data['hyacinite'] = { id:'hyacinite', unlocked:false, opinion:0, }
            state.data['kitrinos'] =  { id:'kitrinos',  unlocked:false, opinion:0, }
            state.data['moviton'] =   { id:'moviton',   unlocked:false, opinion:0, }
            state.data['overlord'] =  { id:'overlord',  unlocked:false, opinion:0, }
            /*----------------------------------------------------------------*/

            // CARNELIAN STARS
            /*----------------------------------------------------------------*/
            state.data['star301']	=	{	id:'star301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:5.94,	planets:0,	faction:'carnelian',	resource1:'hydrogen',	resource2:'helium',	stats:{	'power':52,	'defense':49,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:59400	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:59400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:59400	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'helium',	count:100000000000000	}],	}
            state.data['star163901']	=	{	id:'star163901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:10.33,	planets:2,	faction:'carnelian',	resource1:'uranium',	resource2:'methane',	stats:{	'power':273,	'defense':226,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:103300	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:103300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:103300	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star181901']	=	{	id:'star181901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:11.41,	planets:1,	faction:'carnelian',	resource1:'gem',	resource2:'carbon',	stats:{	'power':397,	'defense':381,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:114100	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:114100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:114100	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star151801']	=	{	id:'star151801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:11.83,	planets:5,	faction:'carnelian',	resource1:'gem',	resource2:'oil',	stats:{	'power':317,	'defense':202,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:118300	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:118300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:118300	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'oil',	count:100000000000000	}],	}
            state.data['star25401']	=	{	id:'star25401',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:11.94,	planets:4,	faction:'carnelian',	resource1:'uranium',	resource2:'gem',	stats:{	'power':207,	'defense':372,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:119400	}],	notifs:['interstellarCarnelianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:119400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:119400	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            state.data['star146301']	=	{	id:'star146301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:12.87,	planets:5,	faction:'carnelian',	resource1:'meteorite',	resource2:'silver',	stats:{	'power':311,	'defense':466,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:128700	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:128700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:128700	}],	statueBaseCosts:[{	id:'meteorite',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star122601']	=	{	id:'star122601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:14.77,	planets:2,	faction:'carnelian',	resource1:'methane',	resource2:'lunarite',	stats:{	'power':426,	'defense':317,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:147700	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:147700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:147700	}],	statueBaseCosts:[{	id:'lunarite',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star79501']	=	{	id:'star79501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:15.07,	planets:1,	faction:'carnelian',	resource1:'lunarite',	resource2:'silver',	stats:{	'power':675,	'defense':565,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:150700	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:150700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:150700	}],	statueBaseCosts:[{	id:'lunarite',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star1501']	=	{	id:'star1501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:15.33,	planets:1,	faction:'carnelian',	resource1:'titanium',	resource2:'gold',	stats:{	'power':410,	'defense':321,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:153300	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:153300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:153300	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'gold',	count:100000000000000	}],	}
            state.data['star79901']	=	{	id:'star79901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:17.58,	planets:1,	faction:'carnelian',	resource1:'carbon',	resource2:'gold',	stats:{	'power':956,	'defense':615,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:175800	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:175800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:175800	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'gold',	count:100000000000000	}],	}
            state.data['star37601']	=	{	id:'star37601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:18.56,	planets:1,	faction:'carnelian',	resource1:'ice',	resource2:'meteorite',	stats:{	'power':706,	'defense':729,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:185600	}],	notifs:['interstellarCarnelianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:185600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:185600	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star123401']	=	{	id:'star123401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:18.95,	planets:5,	faction:'carnelian',	resource1:'carbon',	resource2:'silicon',	stats:{	'power':1415,	'defense':525,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:189500	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:189500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:189500	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'silicon',	count:100000000000000	}],	}
            state.data['star164301']	=	{	id:'star164301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:19.47,	planets:1,	faction:'carnelian',	resource1:'gem',	resource2:'silver',	stats:{	'power':497,	'defense':424,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:194700	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:194700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:194700	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star219102']	=	{	id:'star219102',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:20.38,	planets:1,	faction:'carnelian',	resource1:'wood',	resource2:'meteorite',	stats:{	'power':1232,	'defense':921,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:203800	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:203800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:203800	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star204702']	=	{	id:'star204702',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:20.62,	planets:1,	faction:'carnelian',	resource1:'ice',	resource2:'helium',	stats:{	'power':550,	'defense':863,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:206200	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:206200	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:206200	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'helium',	count:100000000000000	}],	}
            state.data['star116901']	=	{	id:'star116901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:21.18,	planets:1,	faction:'carnelian',	resource1:'oil',	resource2:'lunarite',	stats:{	'power':1570,	'defense':577,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:211800	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:211800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:211800	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star74001']	=	{	id:'star74001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:21.61,	planets:4,	faction:'carnelian',	resource1:'hydrogen',	resource2:'titanium',	stats:{	'power':1494,	'defense':1183,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:216100	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:216100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:216100	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star205102']	=	{	id:'star205102',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:22.74,	planets:5,	faction:'carnelian',	resource1:'silicon',	resource2:'silver',	stats:{	'power':1190,	'defense':810,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:227400	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:227400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:227400	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star144001']	=	{	id:'star144001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:22.98,	planets:1,	faction:'carnelian',	resource1:'helium',	resource2:'methane',	stats:{	'power':1488,	'defense':1031,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:229800	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:229800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:229800	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star222301']	=	{	id:'star222301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.32,	planets:5,	faction:'carnelian',	resource1:'hydrogen',	resource2:'uranium',	stats:{	'power':2311,	'defense':1758,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:243200	}],	notifs:['interstellarCarnelianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:243200	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:243200	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'uranium',	count:100000000000000	}],	}
            state.data['star3901']	=	{	id:'star3901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.56,	planets:3,	faction:'carnelian',	resource1:'lava',	resource2:'uranium',	stats:{	'power':1181,	'defense':671,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:245600	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:245600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:245600	}],	statueBaseCosts:[{	id:'lava',	count:100000000000000	},	{	id:'uranium',	count:100000000000000	}],	}
            state.data['star168301']	=	{	id:'star168301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.63,	planets:1,	faction:'carnelian',	resource1:'methane',	resource2:'lunarite',	stats:{	'power':1253,	'defense':1759,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:246300	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:246300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:246300	}],	statueBaseCosts:[{	id:'lunarite',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star120901']	=	{	id:'star120901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:25.18,	planets:5,	faction:'carnelian',	resource1:'lava',	resource2:'meteorite',	stats:{	'power':900,	'defense':988,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:251800	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:251800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:251800	}],	statueBaseCosts:[{	id:'lava',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star125301']	=	{	id:'star125301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:25.43,	planets:1,	faction:'carnelian',	resource1:'metal',	resource2:'ice',	stats:{	'power':2583,	'defense':1775,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:254300	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:254300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:254300	}],	statueBaseCosts:[{	id:'metal',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star113101']	=	{	id:'star113101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.23,	planets:3,	faction:'carnelian',	resource1:'gold',	resource2:'methane',	stats:{	'power':2375,	'defense':1583,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:262300	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:262300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:262300	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star89101']	=	{	id:'star89101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.56,	planets:5,	faction:'carnelian',	resource1:'titanium',	resource2:'oil',	stats:{	'power':1939,	'defense':1945,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:265600	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:265600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:265600	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'oil',	count:100000000000000	}],	}
            state.data['star93901']	=	{	id:'star93901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.69,	planets:1,	faction:'carnelian',	resource1:'oil',	resource2:'ice',	stats:{	'power':1426,	'defense':1905,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:266900	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:266900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:266900	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star79201']	=	{	id:'star79201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:27.41,	planets:5,	faction:'carnelian',	resource1:'ice',	resource2:'silver',	stats:{	'power':946,	'defense':1465,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:274100	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:274100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:274100	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star80501']	=	{	id:'star80501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:27.9,	planets:2,	faction:'carnelian',	resource1:'wood',	resource2:'metal',	stats:{	'power':897,	'defense':2072,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:279000	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:279000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:279000	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star77301']	=	{	id:'star77301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.61,	planets:1,	faction:'carnelian',	resource1:'lunarite',	resource2:'carbon',	stats:{	'power':1216,	'defense':2159,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:286100	}],	notifs:['interstellarCarnelianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:286100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:286100	}],	statueBaseCosts:[{	id:'lunarite',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star191701']	=	{	id:'star191701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:30.14,	planets:1,	faction:'carnelian',	resource1:'gem',	resource2:'carbon',	stats:{	'power':2828,	'defense':1442,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:301400	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:301400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:301400	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star199702']	=	{	id:'star199702',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.34,	planets:1,	faction:'carnelian',	resource1:'methane',	resource2:'silver',	stats:{	'power':4019,	'defense':1982,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:333400	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:333400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:333400	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star21001']	=	{	id:'star21001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.63,	planets:4,	faction:'carnelian',	resource1:'methane',	resource2:'meteorite',	stats:{	'power':2811,	'defense':1846,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:336300	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:336300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:336300	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star178302']	=	{	id:'star178302',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.73,	planets:1,	faction:'carnelian',	resource1:'metal',	resource2:'methane',	stats:{	'power':3481,	'defense':1638,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:337300	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:337300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:337300	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star32201']	=	{	id:'star32201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:34.7,	planets:1,	faction:'carnelian',	resource1:'wood',	resource2:'silver',	stats:{	'power':4755,	'defense':2729,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:347000	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:347000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:347000	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star74801']	=	{	id:'star74801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:34.86,	planets:2,	faction:'carnelian',	resource1:'gem',	resource2:'helium',	stats:{	'power':2973,	'defense':1585,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:348600	}],	notifs:['interstellarCarnelianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:348600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:348600	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'helium',	count:100000000000000	}],	}
            /*----------------------------------------------------------------*/																																																																																								
                                                                                                                                                                                                                                                                                                                                                                            
            //	PRASNIAN	STARS																																																																																						
            /*----------------------------------------------------------------*/																																																																																								
            state.data['star401']	=	{	id:'star401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:7.8,	planets:1,	faction:'prasnian',	resource1:'lunarite',	resource2:'gem',	stats:{	'power':86,	'defense':71,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:78000	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:78000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:78000	}],	statueBaseCosts:[{	id:'lunarite',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            state.data['star25101']	=	{	id:'star25101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:10.5,	planets:5,	faction:'prasnian',	resource1:'hydrogen',	resource2:'metal',	stats:{	'power':293,	'defense':112,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:105000	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:105000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:105000	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star207601']	=	{	id:'star207601',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:11.64,	planets:1,	faction:'prasnian',	resource1:'helium',	resource2:'lunarite',	stats:{	'power':203,	'defense':238,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:116400	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:116400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:116400	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star223901']	=	{	id:'star223901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:12.4,	planets:4,	faction:'prasnian',	resource1:'silver',	resource2:'meteorite',	stats:{	'power':530,	'defense':337,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:124000	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:124000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:124000	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star121101']	=	{	id:'star121101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:14.8,	planets:1,	faction:'prasnian',	resource1:'methane',	resource2:'hydrogen',	stats:{	'power':750,	'defense':567,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:148000	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:148000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:148000	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star136701']	=	{	id:'star136701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:16.77,	planets:1,	faction:'prasnian',	resource1:'methane',	resource2:'metal',	stats:{	'power':559,	'defense':388,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:167700	}],	notifs:['interstellarPrasnianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:167700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:167700	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star166402']	=	{	id:'star166402',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:17, planets:3,	faction:'prasnian',	resource1:'helium',	resource2:'methane',	stats:{	'power':539,	'defense':511,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:170000	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:170000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:170000	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star95001']	=	{	id:'star95001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:17.71,	planets:1,	faction:'prasnian',	resource1:'titanium',	resource2:'meteorite',	stats:{	'power':595,	'defense':664,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:177100	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:177100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:177100	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star175902']	=	{	id:'star175902',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:17.98,	planets:1,	faction:'prasnian',	resource1:'hydrogen',	resource2:'wood',	stats:{	'power':1247,	'defense':589,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:179800	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:179800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:179800	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'wood',	count:100000000000000	}],	}
            state.data['star56501']	=	{	id:'star56501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:19.19,	planets:1,	faction:'prasnian',	resource1:'oil',	resource2:'gem',	stats:{	'power':370,	'defense':507,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:191900	}],	notifs:['interstellarPrasnianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:191900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:191900	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            state.data['star167801']	=	{	id:'star167801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:19.42,	planets:1,	faction:'prasnian',	resource1:'oil',	resource2:'metal',	stats:{	'power':762,	'defense':511,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:194200	}],	notifs:['interstellarPrasnianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:194200	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:194200	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star103201']	=	{	id:'star103201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:20.26,	planets:1,	faction:'prasnian',	resource1:'hydrogen',	resource2:'methane',	stats:{	'power':857,	'defense':927,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:202600	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:202600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:202600	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star113301']	=	{	id:'star113301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:21.47,	planets:2,	faction:'prasnian',	resource1:'hydrogen',	resource2:'metal',	stats:{	'power':1769,	'defense':631,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:214700	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:214700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:214700	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star199602']	=	{	id:'star199602',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:21.85,	planets:2,	faction:'prasnian',	resource1:'silver',	resource2:'titanium',	stats:{	'power':1518,	'defense':606,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:218500	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:218500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:218500	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star157201']	=	{	id:'star157201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.91,	planets:2,	faction:'prasnian',	resource1:'oil',	resource2:'methane',	stats:{	'power':1093,	'defense':1746,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:249100	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:249100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:249100	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star222201']	=	{	id:'star222201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:23.76,	planets:1,	faction:'prasnian',	resource1:'uranium',	resource2:'silver',	stats:{	'power':718,	'defense':863,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:237600	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:237600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:237600	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star6301']	=	{	id:'star6301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.33,	planets:3,	faction:'prasnian',	resource1:'titanium',	resource2:'lava',	stats:{	'power':1168,	'defense':722,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:243300	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:243300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:243300	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'lava',	count:100000000000000	}],	}
            state.data['star214301']	=	{	id:'star214301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:25.97,	planets:1,	faction:'prasnian',	resource1:'carbon',	resource2:'uranium',	stats:{	'power':1861,	'defense':1698,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:259700	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:259700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:259700	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'uranium',	count:100000000000000	}],	}
            state.data['star40801']	=	{	id:'star40801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.07,	planets:1,	faction:'prasnian',	resource1:'methane',	resource2:'metal',	stats:{	'power':1566,	'defense':1944,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:260700	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:260700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:260700	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star207301']	=	{	id:'star207301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.28,	planets:1,	faction:'prasnian',	resource1:'titanium',	resource2:'wood',	stats:{	'power':944,	'defense':1168,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:262800	}],	notifs:['interstellarPrasnianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:262800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:262800	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'wood',	count:100000000000000	}],	}
            state.data['star169601']	=	{	id:'star169601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.57,	planets:1,	faction:'prasnian',	resource1:'gem',	resource2:'silicon',	stats:{	'power':1903,	'defense':1859,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:265700	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:265700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:265700	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'silicon',	count:100000000000000	}],	}
            state.data['star157101']	=	{	id:'star157101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.11,	planets:4,	faction:'prasnian',	resource1:'oil',	resource2:'helium',	stats:{	'power':1781,	'defense':1088,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:281100	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:281100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:281100	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'helium',	count:100000000000000	}],	}
            state.data['star178501']	=	{	id:'star178501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.26,	planets:2,	faction:'prasnian',	resource1:'hydrogen',	resource2:'uranium',	stats:{	'power':2207,	'defense':1031,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:282600	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:282600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:282600	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'uranium',	count:100000000000000	}],	}
            state.data['star208601']	=	{	id:'star208601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.91,	planets:2,	faction:'prasnian',	resource1:'carbon',	resource2:'methane',	stats:{	'power':2312,	'defense':2295,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:289100	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:289100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:289100	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star78101']	=	{	id:'star78101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:29.48,	planets:1,	faction:'prasnian',	resource1:'wood',	resource2:'hydrogen',	stats:{	'power':1211,	'defense':2494,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:294800	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:294800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:294800	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star123501']	=	{	id:'star123501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:30.95,	planets:1,	faction:'prasnian',	resource1:'meteorite',	resource2:'carbon',	stats:{	'power':2844,	'defense':1816,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:309500	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:309500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:309500	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star85901']	=	{	id:'star85901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:31.5,	planets:3,	faction:'prasnian',	resource1:'lunarite',	resource2:'metal',	stats:{	'power':1673,	'defense':1609,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:315000	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:315000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:315000	}],	statueBaseCosts:[{	id:'lunarite',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star18501']	=	{	id:'star18501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:31.85,	planets:4,	faction:'prasnian',	resource1:'wood',	resource2:'meteorite',	stats:{	'power':1368,	'defense':2485,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:318500	}],	notifs:['interstellarPrasnianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:318500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:318500	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star199801']	=	{	id:'star199801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:32.01,	planets:5,	faction:'prasnian',	resource1:'uranium',	resource2:'silver',	stats:{	'power':3811,	'defense':1989,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:320100	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:320100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:320100	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star141901']	=	{	id:'star141901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:32.1,	planets:4,	faction:'prasnian',	resource1:'gem',	resource2:'metal',	stats:{	'power':2373,	'defense':2562,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:321000	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:321000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:321000	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star5201']	=	{	id:'star5201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:32.36,	planets:1,	faction:'prasnian',	resource1:'methane',	resource2:'ice',	stats:{	'power':2105,	'defense':2952,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:323600	}],	notifs:['interstellarPrasnianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:323600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:323600	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star223701']	=	{	id:'star223701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:32.98,	planets:2,	faction:'prasnian',	resource1:'helium',	resource2:'gold',	stats:{	'power':3065,	'defense':2290,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:329800	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:329800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:329800	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'gold',	count:100000000000000	}],	}
            state.data['star166903']	=	{	id:'star166903',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.03,	planets:3,	faction:'prasnian',	resource1:'silicon',	resource2:'methane',	stats:{	'power':3965,	'defense':2348,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:330300	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:330300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:330300	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star32101']	=	{	id:'star32101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.24,	planets:2,	faction:'prasnian',	resource1:'silver',	resource2:'meteorite',	stats:{	'power':2028,	'defense':2434,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:332400	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:332400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:332400	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star77801']	=	{	id:'star77801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:34.17,	planets:3,	faction:'prasnian',	resource1:'uranium',	resource2:'hydrogen',	stats:{	'power':3402,	'defense':2740,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:341700	}],	notifs:['interstellarPrasnianPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:341700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:341700	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star205201']	=	{	id:'star205201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:34.96,	planets:2,	faction:'prasnian',	resource1:'uranium',	resource2:'lava',	stats:{	'power':2987,	'defense':2014,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:349600	}],	notifs:['interstellarPrasnianPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:349600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:349600	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'lava',	count:100000000000000	}],	}
            /*----------------------------------------------------------------*/																																																																																								
            
            //	HYACINITE STARS
            /*----------------------------------------------------------------*/																																																																																								
            state.data['star201']	=	{	id:'star201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:4.3,	planets:1,	faction:'hyacinite',	resource1:'ice',	resource2:'hydrogen',	stats:{	'power':30,	'defense':20,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:43000	}],	notifs:['interstellarHyacinitePane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:43000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:43000	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star217101']	=	{	id:'star217101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:11.08,	planets:1,	faction:'hyacinite',	resource1:'silver',	resource2:'metal',	stats:{	'power':420,	'defense':143,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:110800	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:110800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:110800	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star166701']	=	{	id:'star166701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:11.64,	planets:5,	faction:'hyacinite',	resource1:'meteorite',	resource2:'silver',	stats:{	'power':331,	'defense':286,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:116400	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:116400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:116400	}],	statueBaseCosts:[{	id:'meteorite',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star179501']	=	{	id:'star179501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:13.47,	planets:1,	faction:'hyacinite',	resource1:'carbon',	resource2:'lava',	stats:{	'power':430,	'defense':411,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:134700	}],	notifs:['interstellarHyacinitePane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:134700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:134700	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'lava',	count:100000000000000	}],	}
            state.data['star6501']	=	{	id:'star6501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:14.13,	planets:1,	faction:'hyacinite',	resource1:'gold',	resource2:'silicon',	stats:{	'power':588,	'defense':522,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:141300	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:141300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:141300	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'silicon',	count:100000000000000	}],	}
            state.data['star222401']	=	{	id:'star222401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:14.65,	planets:1,	faction:'hyacinite',	resource1:'lava',	resource2:'methane',	stats:{	'power':527,	'defense':239,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:146500	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:146500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:146500	}],	statueBaseCosts:[{	id:'lava',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star200001']	=	{	id:'star200001',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:19.26,	planets:4,	faction:'hyacinite',	resource1:'gold',	resource2:'meteorite',	stats:{	'power':1176,	'defense':612,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:192600	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:192600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:192600	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star24201']	=	{	id:'star24201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:19.77,	planets:5,	faction:'hyacinite',	resource1:'gold',	resource2:'lunarite',	stats:{	'power':595,	'defense':956,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:197700	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:197700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:197700	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star224202']	=	{	id:'star224202',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:22.37,	planets:2,	faction:'hyacinite',	resource1:'titanium',	resource2:'hydrogen',	stats:{	'power':1841,	'defense':1155,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:223700	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:223700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:223700	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star92801']	=	{	id:'star92801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.88,	planets:3,	faction:'hyacinite',	resource1:'methane',	resource2:'carbon',	stats:{	'power':2461,	'defense':1301,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:248800	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:248800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:248800	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star172701']	=	{	id:'star172701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.9,	planets:2,	faction:'hyacinite',	resource1:'methane',	resource2:'helium',	stats:{	'power':2333,	'defense':972,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:249000	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:249000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:249000	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'helium',	count:100000000000000	}],	}
            state.data['star86401']	=	{	id:'star86401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.99,	planets:1,	faction:'hyacinite',	resource1:'titanium',	resource2:'lunarite',	stats:{	'power':1867,	'defense':920,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:249900	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:249900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:249900	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star202902']	=	{	id:'star202902',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:27.63,	planets:5,	faction:'hyacinite',	resource1:'gem',	resource2:'metal',	stats:{	'power':1261,	'defense':1135,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:276300	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:276300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:276300	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star177001']	=	{	id:'star177001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:27.79,	planets:3,	faction:'hyacinite',	resource1:'carbon',	resource2:'hydrogen',	stats:{	'power':1184,	'defense':2279,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:277900	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:277900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:277900	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star68301']	=	{	id:'star68301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:27.81,	planets:3,	faction:'hyacinite',	resource1:'ice',	resource2:'uranium',	stats:{	'power':2065,	'defense':958,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:278100	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:278100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:278100	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'uranium',	count:100000000000000	}],	}
            state.data['star205001']	=	{	id:'star205001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.66,	planets:2,	faction:'hyacinite',	resource1:'uranium',	resource2:'silver',	stats:{	'power':2555,	'defense':1812,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:286600	}],	notifs:['interstellarHyacinitePane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:286600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:286600	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star13401']	=	{	id:'star13401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.66,	planets:2,	faction:'hyacinite',	resource1:'silicon',	resource2:'metal',	stats:{	'power':2684,	'defense':902,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:286600	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:286600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:286600	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star34201']	=	{	id:'star34201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.75,	planets:5,	faction:'hyacinite',	resource1:'carbon',	resource2:'silver',	stats:{	'power':3086,	'defense':1715,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:287500	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:287500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:287500	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star182101']	=	{	id:'star182101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:29.12,	planets:1,	faction:'hyacinite',	resource1:'silicon',	resource2:'gold',	stats:{	'power':1192,	'defense':1832,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:291200	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:291200	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:291200	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'gold',	count:100000000000000	}],	}
            state.data['star178401']	=	{	id:'star178401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:29.25,	planets:3,	faction:'hyacinite',	resource1:'silver',	resource2:'hydrogen',	stats:{	'power':3295,	'defense':1540,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:292500	}],	notifs:['interstellarHyacinitePane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:292500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:292500	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star107601']	=	{	id:'star107601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:29.38,	planets:5,	faction:'hyacinite',	resource1:'helium',	resource2:'silicon',	stats:{	'power':2195,	'defense':1127,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:293800	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:293800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:293800	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'silicon',	count:100000000000000	}],	}
            state.data['star192101']	=	{	id:'star192101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:29.87,	planets:5,	faction:'hyacinite',	resource1:'wood',	resource2:'carbon',	stats:{	'power':2350,	'defense':2425,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:298700	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:298700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:298700	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star24001']	=	{	id:'star24001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:29.87,	planets:1,	faction:'hyacinite',	resource1:'lava',	resource2:'helium',	stats:{	'power':1036,	'defense':1460,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:298700	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:298700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:298700	}],	statueBaseCosts:[{	id:'lava',	count:100000000000000	},	{	id:'helium',	count:100000000000000	}],	}
            state.data['star16601']	=	{	id:'star16601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:30.06,	planets:1,	faction:'hyacinite',	resource1:'hydrogen',	resource2:'gem',	stats:{	'power':1761,	'defense':1234,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:300600	}],	notifs:['interstellarHyacinitePane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:300600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:300600	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            state.data['star27501']	=	{	id:'star27501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:31.36,	planets:2,	faction:'hyacinite',	resource1:'helium',	resource2:'ice',	stats:{	'power':1490,	'defense':1216,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:313600	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:313600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:313600	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star121601']	=	{	id:'star121601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:31.88,	planets:1,	faction:'hyacinite',	resource1:'metal',	resource2:'ice',	stats:{	'power':1751,	'defense':2344,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:318800	}],	notifs:['interstellarHyacinitePane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:318800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:318800	}],	statueBaseCosts:[{	id:'metal',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star212102']	=	{	id:'star212102',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.35,	planets:4,	faction:'hyacinite',	resource1:'gold',	resource2:'ice',	stats:{	'power':1144,	'defense':1466,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:333500	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:333500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:333500	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star117501']	=	{	id:'star117501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.66,	planets:1,	faction:'hyacinite',	resource1:'silver',	resource2:'carbon',	stats:{	'power':2373,	'defense':2370,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:336600	}],	notifs:['interstellarHyacinitePane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:336600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:336600	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            /*----------------------------------------------------------------*/																																																																																								
                                                                                                                                                                                                                                                                                                                                                                            
            //	KITRINOS	STARS																																																																																						
            /*----------------------------------------------------------------*/																																																																																								
            state.data['star501']	    =	{	id:'star501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:8.31,	planets:1,	faction:'kitrinos',	resource1:'titanium',	resource2:'silicon',	stats:{	'power':132,	'defense':117,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:83100	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:83100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:83100	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'silicon',	count:100000000000000	}],	}
            state.data['star130601']	=	{	id:'star130601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:9.69,	planets:2,	faction:'kitrinos',	resource1:'gold',	resource2:'lava',	stats:{	'power':144,	'defense':229,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:96900	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:96900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:96900	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'lava',	count:100000000000000	}],	}
            state.data['star158101']	=	{	id:'star158101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:10.73,	planets:5,	faction:'kitrinos',	resource1:'oil',	resource2:'lava',	stats:{	'power':443,	'defense':147,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:107300	}],	notifs:['interstellarKitrinosPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:107300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:107300	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'lava',	count:100000000000000	}],	}
            state.data['star224601']	=	{	id:'star224601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:11.8,	planets:1,	faction:'kitrinos',	resource1:'methane',	resource2:'gold',	stats:{	'power':513,	'defense':164,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:118000	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:118000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:118000	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'gold',	count:100000000000000	}],	}
            state.data['star58601']	    =	{	id:'star58601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:11.83,	planets:4,	faction:'kitrinos',	resource1:'helium',	resource2:'methane',	stats:{	'power':427,	'defense':184,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:118300	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:118300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:118300	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star10101']	    =	{	id:'star10101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:12.2,	planets:1,	faction:'kitrinos',	resource1:'gold',	resource2:'hydrogen',	stats:{	'power':506,	'defense':334,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:122000	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:122000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:122000	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star194201']	=	{	id:'star194201',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:14.05,	planets:1,	faction:'kitrinos',	resource1:'silver',	resource2:'lava',	stats:{	'power':460,	'defense':465,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:140500	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:140500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:140500	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'lava',	count:100000000000000	}],	}
            state.data['star1101']	    =	{	id:'star1101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:14.22,	planets:3,	faction:'kitrinos',	resource1:'silicon',	resource2:'methane',	stats:{	'power':779,	'defense':410,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:142200	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:142200	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:142200	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star72501']	    =	{	id:'star72501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:14.76,	planets:4,	faction:'kitrinos',	resource1:'uranium',	resource2:'lava',	stats:{	'power':620,	'defense':612,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:147600	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:147600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:147600	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'lava',	count:100000000000000	}],	}
            state.data['star210501']	=	{	id:'star210501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:15.39,	planets:1,	faction:'kitrinos',	resource1:'helium',	resource2:'meteorite',	stats:{	'power':479,	'defense':563,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:153900	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:153900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:153900	}],	statueBaseCosts:[{	id:'meteorite',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star189701']	=	{	id:'star189701',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:15.76,	planets:1,	faction:'kitrinos',	resource1:'helium',	resource2:'gold',	stats:{	'power':708,	'defense':278,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:157600	}],	notifs:['interstellarKitrinosPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:157600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:157600	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'gold',	count:100000000000000	}],	}
            state.data['star175601']	=	{	id:'star175601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:16.45,	planets:4,	faction:'kitrinos',	resource1:'wood',	resource2:'meteorite',	stats:{	'power':411,	'defense':544,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:164500	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:164500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:164500	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star206902']	=	{	id:'star206902',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:16.59,	planets:5,	faction:'kitrinos',	resource1:'hydrogen',	resource2:'carbon',	stats:{	'power':602,	'defense':555,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:165900	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:165900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:165900	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star133601']	=	{	id:'star133601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:18.56,	planets:3,	faction:'kitrinos',	resource1:'titanium',	resource2:'methane',	stats:{	'power':471,	'defense':749,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:185600	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:185600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:185600	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star135801']	=	{	id:'star135801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:18.81,	planets:1,	faction:'kitrinos',	resource1:'uranium',	resource2:'meteorite',	stats:{	'power':635,	'defense':664,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:188100	}],	notifs:['interstellarKitrinosPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:188100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:188100	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star39101']	    =	{	id:'star39101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:18.88,	planets:1,	faction:'kitrinos',	resource1:'ice',	resource2:'lunarite',	stats:{	'power':1396,	'defense':698,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:188800	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:188800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:188800	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star107001']	=	{	id:'star107001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:19.35,	planets:2,	faction:'kitrinos',	resource1:'gold',	resource2:'hydrogen',	stats:{	'power':805,	'defense':587,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:193500	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:193500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:193500	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star105801']	=	{	id:'star105801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:20.45,	planets:3,	faction:'kitrinos',	resource1:'lunarite',	resource2:'hydrogen',	stats:{	'power':1478,	'defense':1182,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:204500	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:204500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:204500	}],	statueBaseCosts:[{	id:'lunarite',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star224201']	=	{	id:'star224201',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:22.37,	planets:1,	faction:'kitrinos',	resource1:'silver',	resource2:'metal',	stats:{	'power':1275,	'defense':672,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:223700	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:223700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:223700	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star205101']	=	{	id:'star205101',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:22.74,	planets:1,	faction:'kitrinos',	resource1:'helium',	resource2:'titanium',	stats:{	'power':747,	'defense':1117,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:227400	}],	notifs:['interstellarKitrinosPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:227400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:227400	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star162501']	=	{	id:'star162501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:23.53,	planets:5,	faction:'kitrinos',	resource1:'oil',	resource2:'meteorite',	stats:{	'power':1393,	'defense':773,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:235300	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:235300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:235300	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star4001']	    =	{	id:'star4001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.38,	planets:4,	faction:'kitrinos',	resource1:'ice',	resource2:'silicon',	stats:{	'power':1337,	'defense':775,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:243800	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:243800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:243800	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'silicon',	count:100000000000000	}],	}
            state.data['star141101']	=	{	id:'star141101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:25.96,	planets:1,	faction:'kitrinos',	resource1:'ice',	resource2:'lunarite',	stats:{	'power':2177,	'defense':1625,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:259600	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:259600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:259600	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star180502']	=	{	id:'star180502',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.17,	planets:2,	faction:'kitrinos',	resource1:'wood',	resource2:'metal',	stats:{	'power':1908,	'defense':980,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:261700	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:261700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:261700	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star208702']	=	{	id:'star208702',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.6,	planets:1,	faction:'kitrinos',	resource1:'silicon',	resource2:'wood',	stats:{	'power':1034,	'defense':1838,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:266000	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:266000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:266000	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'wood',	count:100000000000000	}],	}
            state.data['star85501']     =	{	id:'star85501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:27.3,	planets:2,	faction:'kitrinos',	resource1:'meteorite',	resource2:'titanium',	stats:{	'power':1049,	'defense':1778,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:273000	}],	notifs:['interstellarKitrinosPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:273000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:273000	}],	statueBaseCosts:[{	id:'meteorite',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star217202']	=	{	id:'star217202',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.19,	planets:1,	faction:'kitrinos',	resource1:'meteorite',	resource2:'uranium',	stats:{	'power':2289,	'defense':1983,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:281900	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:281900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:281900	}],	statueBaseCosts:[{	id:'meteorite',	count:100000000000000	},	{	id:'uranium',	count:100000000000000	}],	}
            state.data['star180101']	=	{	id:'star180101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.38,	planets:3,	faction:'kitrinos',	resource1:'methane',	resource2:'gem',	stats:{	'power':1870,	'defense':1624,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:283800	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:283800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:283800	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            state.data['star13801']	    =	{	id:'star13801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:32.54,	planets:4,	faction:'kitrinos',	resource1:'carbon',	resource2:'gold',	stats:{	'power':3103,	'defense':2163,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:325400	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:325400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:325400	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'gold',	count:100000000000000	}],	}
            state.data['star37101']	    =	{	id:'star37101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:32.71,	planets:1,	faction:'kitrinos',	resource1:'helium',	resource2:'silver',	stats:{	'power':3279,	'defense':2710,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:327100	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:327100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:327100	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star42501']	    =	{	id:'star42501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.1,	planets:1,	faction:'kitrinos',	resource1:'gold',	resource2:'hydrogen',	stats:{	'power':3316,	'defense':3166,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:331000	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:331000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:331000	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star80901']	    =	{	id:'star80901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.23,	planets:4,	faction:'kitrinos',	resource1:'methane',	resource2:'titanium',	stats:{	'power':1455,	'defense':3056,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:332300	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:332300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:332300	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star215902']	=	{	id:'star215902',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.25,	planets:4,	faction:'kitrinos',	resource1:'uranium',	resource2:'titanium',	stats:{	'power':4146,	'defense':2027,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:332500	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:332500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:332500	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star190502']	=	{	id:'star190502',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.98,	planets:5,	faction:'kitrinos',	resource1:'silver',	resource2:'lunarite',	stats:{	'power':3897,	'defense':1867,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:339800	}],	notifs:['interstellarKitrinosPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:339800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:339800	}],	statueBaseCosts:[{	id:'silver',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star99701']	    =	{	id:'star99701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:34.33,	planets:4,	faction:'kitrinos',	resource1:'silver',	resource2:'ice',	stats:{	'power':3812,	'defense':2495,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:343300	}],	notifs:['interstellarKitrinosPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:343300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:343300	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star176802']	=	{	id:'star176802',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:34.33,	planets:5,	faction:'kitrinos',	resource1:'gem',	resource2:'titanium',	stats:{	'power':4481,	'defense':2620,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:343300	}],	notifs:['interstellarKitrinosPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:343300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:343300	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            /*----------------------------------------------------------------*/																																																																																								
                                                                                                                                                                                                                                                                                                                                                                            
            //	MOVITON	STARS																																																																																						
            /*----------------------------------------------------------------*/																																																																																								
            state.data['star701']	=	{	id:'star701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:8.55,	planets:1,	faction:'moviton',	resource1:'carbon',	resource2:'methane',	stats:{	'power':146,	'defense':131,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:85500	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:85500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:85500	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star601']	=	{	id:'star601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:8.6,	planets:5,	faction:'moviton',	resource1:'silicon',	resource2:'methane',	stats:{	'power':110,	'defense':129,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:86000	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:86000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:86000	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star80101']	=	{	id:'star80101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:10.89,	planets:4,	faction:'moviton',	resource1:'hydrogen',	resource2:'helium',	stats:{	'power':125,	'defense':198,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:108900	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:108900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:108900	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'helium',	count:100000000000000	}],	}
            state.data['star213301']	=	{	id:'star213301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:11.43,	planets:5,	faction:'moviton',	resource1:'uranium',	resource2:'ice',	stats:{	'power':289,	'defense':177,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:114300	}],	notifs:['interstellarMovitonPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:114300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:114300	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star13601']	=	{	id:'star13601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:11.9,	planets:4,	faction:'moviton',	resource1:'gem',	resource2:'silicon',	stats:{	'power':491,	'defense':413,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:119000	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:119000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:119000	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'silicon',	count:100000000000000	}],	}
            state.data['star51801']	=	{	id:'star51801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:12.39,	planets:1,	faction:'moviton',	resource1:'uranium',	resource2:'titanium',	stats:{	'power':320,	'defense':355,	'speed':7	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:123900	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:123900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:123900	}],	statueBaseCosts:[{	id:'uranium',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star35801']	=	{	id:'star35801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:12.78,	planets:1,	faction:'moviton',	resource1:'lava',	resource2:'silver',	stats:{	'power':468,	'defense':285,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:127800	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:127800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:127800	}],	statueBaseCosts:[{	id:'lava',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star216801']	=	{	id:'star216801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:13.07,	planets:4,	faction:'moviton',	resource1:'lunarite',	resource2:'ice',	stats:{	'power':526,	'defense':490,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:130700	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:130700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:130700	}],	statueBaseCosts:[{	id:'lunarite',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star224101']	=	{	id:'star224101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:13.16,	planets:1,	faction:'moviton',	resource1:'wood',	resource2:'metal',	stats:{	'power':587,	'defense':285,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:131600	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:131600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:131600	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'metal',	count:100000000000000	}],	}
            state.data['star114001']	=	{	id:'star114001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:13.91,	planets:5,	faction:'moviton',	resource1:'metal',	resource2:'meteorite',	stats:{	'power':705,	'defense':479,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:139100	}],	notifs:['interstellarMovitonPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:139100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:139100	}],	statueBaseCosts:[{	id:'metal',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star15301']	=	{	id:'star15301',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:14.57,	planets:2,	faction:'moviton',	resource1:'metal',	resource2:'hydrogen',	stats:{	'power':568,	'defense':229,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:145700	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:145700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:145700	}],	statueBaseCosts:[{	id:'metal',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star69601']	=	{	id:'star69601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:16,	planets:2,	faction:'moviton',	resource1:'gem',	resource2:'titanium',	stats:{	'power':657,	'defense':767,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:160000	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:160000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:160000	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star148501']	=	{	id:'star148501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:16.1,	planets:2,	faction:'moviton',	resource1:'oil',	resource2:'methane',	stats:{	'power':443,	'defense':384,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:161000	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:161000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:161000	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star155801']	=	{	id:'star155801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:16.47,	planets:3,	faction:'moviton',	resource1:'ice',	resource2:'meteorite',	stats:{	'power':633,	'defense':589,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:164700	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:164700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:164700	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star185101']	=	{	id:'star185101',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:17.05,	planets:1,	faction:'moviton',	resource1:'silicon',	resource2:'gold',	stats:{	'power':802,	'defense':792,	'speed':10	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:170500	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:170500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:170500	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'gold',	count:100000000000000	}],	}
            state.data['star175901']	=	{	id:'star175901',	unlocked:false,	status:'new',	donor:true,	count:0,	spy:0,	distance:17.98,	planets:1,	faction:'moviton',	resource1:'helium',	resource2:'meteorite',	stats:{	'power':540,	'defense':332,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:179800	}],	notifs:['interstellarMovitonPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:179800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:179800	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star203902']	=	{	id:'star203902',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:18.72,	planets:5,	faction:'moviton',	resource1:'wood',	resource2:'uranium',	stats:{	'power':873,	'defense':1048,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:187200	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:187200	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:187200	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'uranium',	count:100000000000000	}],	}
            state.data['star204801']	=	{	id:'star204801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:19.47,	planets:2,	faction:'moviton',	resource1:'silicon',	resource2:'gem',	stats:{	'power':1496,	'defense':1070,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:194700	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:194700	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:194700	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            state.data['star211202']	=	{	id:'star211202',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:19.74,	planets:3,	faction:'moviton',	resource1:'methane',	resource2:'silver',	stats:{	'power':1331,	'defense':554,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:197400	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:197400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:197400	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star100801']	=	{	id:'star100801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:19.95,	planets:1,	faction:'moviton',	resource1:'metal',	resource2:'titanium',	stats:{	'power':1095,	'defense':685,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:199500	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:199500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:199500	}],	statueBaseCosts:[{	id:'metal',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star124101']	=	{	id:'star124101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:20.03,	planets:4,	faction:'moviton',	resource1:'hydrogen',	resource2:'ice',	stats:{	'power':863,	'defense':583,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:200300	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:200300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:200300	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star139701']	=	{	id:'star139701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:20.24,	planets:1,	faction:'moviton',	resource1:'methane',	resource2:'silicon',	stats:{	'power':1624,	'defense':1208,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:202400	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:202400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:202400	}],	statueBaseCosts:[{	id:'methane',	count:100000000000000	},	{	id:'silicon',	count:100000000000000	}],	}
            state.data['star50401']	=	{	id:'star50401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:20.74,	planets:1,	faction:'moviton',	resource1:'lava',	resource2:'gem',	stats:{	'power':1439,	'defense':863,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:207400	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:207400	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:207400	}],	statueBaseCosts:[{	id:'lava',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            state.data['star159101']	=	{	id:'star159101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:21.28,	planets:4,	faction:'moviton',	resource1:'helium',	resource2:'lunarite',	stats:{	'power':830,	'defense':652,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:212800	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:212800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:212800	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'lunarite',	count:100000000000000	}],	}
            state.data['star148101']	=	{	id:'star148101',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:21.99,	planets:1,	faction:'moviton',	resource1:'carbon',	resource2:'gem',	stats:{	'power':1817,	'defense':977,	'speed':5	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:219900	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:219900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:219900	}],	statueBaseCosts:[{	id:'carbon',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            state.data['star157301']	=	{	id:'star157301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:22.45,	planets:1,	faction:'moviton',	resource1:'silicon',	resource2:'ice',	stats:{	'power':852,	'defense':606,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:224500	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:224500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:224500	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'ice',	count:100000000000000	}],	}
            state.data['star72601']	=	{	id:'star72601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:22.48,	planets:3,	faction:'moviton',	resource1:'hydrogen',	resource2:'silver',	stats:{	'power':1244,	'defense':1466,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:224800	}],	notifs:['interstellarMovitonPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:224800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:224800	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star224801']	=	{	id:'star224801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:23.5,	planets:3,	faction:'moviton',	resource1:'silicon',	resource2:'titanium',	stats:{	'power':1608,	'defense':566,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:235000	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:235000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:235000	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'titanium',	count:100000000000000	}],	}
            state.data['star71001']	=	{	id:'star71001',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:23.59,	planets:3,	faction:'moviton',	resource1:'helium',	resource2:'silver',	stats:{	'power':792,	'defense':1615,	'speed':12	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:235900	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:235900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:235900	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star207501']	=	{	id:'star207501',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:23.98,	planets:3,	faction:'moviton',	resource1:'metal',	resource2:'carbon',	stats:{	'power':713,	'defense':1513,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:239800	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:239800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:239800	}],	statueBaseCosts:[{	id:'metal',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star168302']	=	{	id:'star168302',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:24.63,	planets:1,	faction:'moviton',	resource1:'ice',	resource2:'oil',	stats:{	'power':2228,	'defense':1446,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:246300	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:246300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:246300	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'oil',	count:100000000000000	}],	}
            state.data['star128901']	=	{	id:'star128901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:25.3,	planets:4,	faction:'moviton',	resource1:'helium',	resource2:'methane',	stats:{	'power':2389,	'defense':1753,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:253000	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:253000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:253000	}],	statueBaseCosts:[{	id:'helium',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star68401']	=	{	id:'star68401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:25.48,	planets:1,	faction:'moviton',	resource1:'oil',	resource2:'meteorite',	stats:{	'power':2297,	'defense':1156,	'speed':9	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:254800	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:254800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:254800	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'meteorite',	count:100000000000000	}],	}
            state.data['star30701']	=	{	id:'star30701',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:26.52,	planets:1,	faction:'moviton',	resource1:'wood',	resource2:'carbon',	stats:{	'power':1231,	'defense':1786,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:265200	}],	notifs:['interstellarMovitonPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:265200	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:265200	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star193402']	=	{	id:'star193402',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:27.59,	planets:3,	faction:'moviton',	resource1:'hydrogen',	resource2:'carbon',	stats:{	'power':1250,	'defense':1062,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:275900	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:275900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:275900	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star84201']	=	{	id:'star84201',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:28.99,	planets:4,	faction:'moviton',	resource1:'hydrogen',	resource2:'methane',	stats:{	'power':2628,	'defense':1914,	'speed':6	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:289900	}],	notifs:['interstellarMovitonPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:289900	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:289900	}],	statueBaseCosts:[{	id:'hydrogen',	count:100000000000000	},	{	id:'methane',	count:100000000000000	}],	}
            state.data['star76401']	=	{	id:'star76401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:29.66,	planets:4,	faction:'moviton',	resource1:'titanium',	resource2:'carbon',	stats:{	'power':2969,	'defense':1045,	'speed':11	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:296600	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:296600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:296600	}],	statueBaseCosts:[{	id:'titanium',	count:100000000000000	},	{	id:'carbon',	count:100000000000000	}],	}
            state.data['star32301']	=	{	id:'star32301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:31.03,	planets:5,	faction:'moviton',	resource1:'gold',	resource2:'wood',	stats:{	'power':1018,	'defense':1797,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:310300	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:310300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:310300	}],	statueBaseCosts:[{	id:'wood',	count:100000000000000	},	{	id:'wood',	count:100000000000000	}],	}
            state.data['star191401']	=	{	id:'star191401',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:31.11,	planets:1,	faction:'moviton',	resource1:'meteorite',	resource2:'uranium',	stats:{	'power':3584,	'defense':2215,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:311100	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:311100	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:311100	}],	statueBaseCosts:[{	id:'meteorite',	count:100000000000000	},	{	id:'uranium',	count:100000000000000	}],	}
            state.data['star118301']	=	{	id:'star118301',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:31.18,	planets:4,	faction:'moviton',	resource1:'gold',	resource2:'wood',	stats:{	'power':3351,	'defense':2096,	'speed':13	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:311800	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:311800	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:311800	}],	statueBaseCosts:[{	id:'gold',	count:100000000000000	},	{	id:'wood',	count:100000000000000	}],	}
            state.data['star166901']	=	{	id:'star166901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.03,	planets:2,	faction:'moviton',	resource1:'gem',	resource2:'silver',	stats:{	'power':3696,	'defense':1445,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:330300	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:330300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:330300	}],	statueBaseCosts:[{	id:'gem',	count:100000000000000	},	{	id:'silver',	count:100000000000000	}],	}
            state.data['star62901']	=	{	id:'star62901',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.73,	planets:1,	faction:'moviton',	resource1:'meteorite',	resource2:'hydrogen',	stats:{	'power':2835,	'defense':3390,	'speed':8	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:337300	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:337300	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:337300	}],	statueBaseCosts:[{	id:'meteorite',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star21601']	=	{	id:'star21601',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:33.86,	planets:2,	faction:'moviton',	resource1:'oil',	resource2:'hydrogen',	stats:{	'power':2901,	'defense':2952,	'speed':14	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:338600	}],	notifs:['interstellarMovitonPane'],	atmosphere:false,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:338600	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:338600	}],	statueBaseCosts:[{	id:'oil',	count:100000000000000	},	{	id:'hydrogen',	count:100000000000000	}],	}
            state.data['star63801']	=	{	id:'star63801',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:34.2,	planets:5,	faction:'moviton',	resource1:'ice',	resource2:'oil',	stats:{	'power':2548,	'defense':2405,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:342000	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:342000	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:342000	}],	statueBaseCosts:[{	id:'ice',	count:100000000000000	},	{	id:'oil',	count:100000000000000	}],	}
            state.data['star187202']	=	{	id:'star187202',	unlocked:false,	status:'new',	donor:false,	count:0,	spy:0,	distance:34.35,	planets:5,	faction:'moviton',	resource1:'silicon',	resource2:'gem',	stats:{	'power':4233,	'defense':2482,	'speed':15	},	costType:'FIXED',	baseCosts:[{	id:'antimatter',	count:343500	}],	notifs:['interstellarMovitonPane'],	atmosphere:true,	subStatus:'none',	probeBaseCosts:[{	id:'probe',	count:1	},	{	id:'antimatter',	count:343500	}],	terraformBaseCosts:[{	id:'terraformer',	count:1	},	{	id:'antimatter',	count:343500	}],	statueBaseCosts:[{	id:'silicon',	count:100000000000000	},	{	id:'gem',	count:100000000000000	}],	}
            /*----------------------------------------------------------------*/
            
            // DARKMATTER
            /*----------------------------------------------------------------*/
            state.data['darkmatter'] = { id:'darkmatter', unlocked:false, count:0, notifs:['darkmatterPane'], unlocks:['upgradeGain', 'upgradeStorage1', 'upgradeStorage2', 'techEnergyStorage6', 'upgradeStorage3',
                                                                                                                       'techPlasma3', 'upgradeWonder1', 'upgradeWonder2', 'upgradeWonder3', 'autoEmc', 'techPlasma4', 'techPlasmaStorage3',
                                                                                                                       'upgradeScience1', 'upgradeScience2', 'techScience5', 'upgradeEnergyBoost',
                                                                                                                       'upgradeTier1', 'techEnergyStorage5', 'multiBuy', 'boostCapital', 'techTier5',
                                                                                                                       'upgradeFuel1', 'upgradeSpaceship', 'techPlasmaStorage4', 'techMeteorite3', 'techMeteorite4',
                                                                                                                       'boostDarkmatter', 'upgradeFaction',
                                                                                                                       'carnelian', 'prasnian', 'hyacinite', 'kitrinos', 'moviton', 'overlord'], }
            /*----------------------------------------------------------------*/
            
            // DM CARNELIAN
            /*----------------------------------------------------------------*/
            state.data['upgradeGain'] =        { id:'upgradeGain',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:5  }], notifs:['stargazeCarnelianPane'], faction:'carnelian', opinion:3,  }
            state.data['upgradeStorage1'] =    { id:'upgradeStorage1',    unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:8  }], notifs:['stargazeCarnelianPane'], faction:'carnelian', opinion:6,  }
            state.data['upgradeStorage2'] =    { id:'upgradeStorage2',    unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:21 }], notifs:['stargazeCarnelianPane'], faction:'carnelian', opinion:14, }
            state.data['techEnergyStorage6'] = { id:'techEnergyStorage6', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:26 }], notifs:['stargazeCarnelianPane'], faction:'carnelian', opinion:15, unlocks:['energyS6'], }
            state.data['upgradeStorage3'] =    { id:'upgradeStorage3',    unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:37 }], notifs:['stargazeCarnelianPane'], faction:'carnelian', opinion:26, }
            /*----------------------------------------------------------------*/
            
            // DM PRASNIAN
            /*----------------------------------------------------------------*/
            state.data['techPlasma3'] =        { id:'techPlasma3',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:11 }], notifs:['stargazePrasnianPane'], faction:'prasnian', opinion:4,  unlocks:['plasmaT3', 'achPlasmaT3'], }
            state.data['upgradeWonder1'] =     { id:'upgradeWonder1',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:13 }], notifs:['stargazePrasnianPane'], faction:'prasnian', opinion:10, }
            state.data['techPlasmaStorage3'] = { id:'techPlasmaStorage3', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:15 }], notifs:['stargazePrasnianPane'], faction:'prasnian', opinion:12, unlocks:['plasmaS3'], }
            state.data['upgradeWonder2'] =     { id:'upgradeWonder2',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:16 }], notifs:['stargazePrasnianPane'], faction:'prasnian', opinion:15, }
            state.data['upgradeWonder3'] =     { id:'upgradeWonder3',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:19 }], notifs:['stargazePrasnianPane'], faction:'prasnian', opinion:11, }
            state.data['autoEmc'] =            { id:'autoEmc',            unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:24 }], notifs:['stargazePrasnianPane'], faction:'prasnian', opinion:17, }
            state.data['techPlasma4'] =        { id:'techPlasma4',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:25 }], notifs:['stargazePrasnianPane'], faction:'prasnian', opinion:17, unlocks:['plasmaT4', 'achPlasmaT4'], }
            /*----------------------------------------------------------------*/
            
            // DM HYACINITE
            /*----------------------------------------------------------------*/
            state.data['upgradeScience1'] =    { id:'upgradeScience1',    unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:7  }], notifs:['stargazeHyacinitePane'], faction:'hyacinite', opinion:3,  }
            state.data['upgradeScience2'] =    { id:'upgradeScience2',    unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:16 }], notifs:['stargazeHyacinitePane'], faction:'hyacinite', opinion:12, }
            state.data['techScience5'] =       { id:'techScience5',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:24 }], notifs:['stargazeHyacinitePane'], faction:'hyacinite', opinion:14, unlocks:['scienceT5', 'achScienceT5'], }
            state.data['upgradeEnergyBoost'] = { id:'upgradeEnergyBoost', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:36 }], notifs:['stargazeHyacinitePane'], faction:'hyacinite', opinion:25, }
            /*----------------------------------------------------------------*/
            
            // DM KITRINOS
            /*----------------------------------------------------------------*/
            state.data['upgradeTier1'] =       { id:'upgradeTier1',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:8  }], notifs:['stargazeKitrinosPane'], faction:'kitrinos', opinion:4,  }
            state.data['techEnergyStorage5'] = { id:'techEnergyStorage5', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:14 }], notifs:['stargazeKitrinosPane'], faction:'kitrinos', opinion:17, unlocks:['energyS5'], }
            state.data['multiBuy'] =           { id:'multiBuy',           unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:17 }], notifs:['stargazeKitrinosPane'], faction:'kitrinos', opinion:20, }
            state.data['boostCapital'] =       { id:'boostCapital',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:30 }], notifs:['stargazeKitrinosPane'], faction:'kitrinos', opinion:18, }
            state.data['techTier5'] =          { id:'techTier5',          unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:35 }], notifs:['stargazeKitrinosPane'], faction:'kitrinos', opinion:20, }
            /*----------------------------------------------------------------*/
            
            // DM MOVITON
            /*----------------------------------------------------------------*/
            state.data['upgradeFuel1'] =       { id:'upgradeFuel1',       unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:11 }], notifs:['stargazeMovitonPane'], faction:'moviton', opinion:7,  }
            state.data['upgradeSpaceship'] =   { id:'upgradeSpaceship',   unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:23 }], notifs:['stargazeMovitonPane'], faction:'moviton', opinion:28, }
            state.data['techPlasmaStorage4'] = { id:'techPlasmaStorage4', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:29 }], notifs:['stargazeMovitonPane'], faction:'moviton', opinion:28, unlocks:['plasmaS4'], }
            state.data['techMeteorite3'] =     { id:'techMeteorite3',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:37 }], notifs:['stargazeMovitonPane'], faction:'moviton', opinion:29, unlocks:['meteoriteT3', 'achMeteoriteT3'], }
            state.data['techMeteorite4'] =     { id:'techMeteorite4',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:49 }], notifs:['stargazeMovitonPane'], faction:'moviton', opinion:36, unlocks:['meteoriteT4', 'achMeteoriteT4'], }
            /*----------------------------------------------------------------*/
            
            // DM OVERLORD
            /*----------------------------------------------------------------*/
            state.data['boostDarkmatter'] = { id:'boostDarkmatter', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:30 }], notifs:['stargazeOverlordPane'], faction:'overlord', opinion:20, }
            state.data['upgradeFaction'] =  { id:'upgradeFaction',  unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'darkmatter', count:49 }], notifs:['stargazeOverlordPane'], faction:'overlord', opinion:20, }
            /*----------------------------------------------------------------*/
            
            // ULTRITE
            /*----------------------------------------------------------------*/
            state.data['ultrite'] = { id:'ultrite', unlocked:false, count:0, notifs:['ultritePane', 'helpPane'], }
            /*----------------------------------------------------------------*/
            
            // UPGRADES
            /*----------------------------------------------------------------*/
            state.data['overlordProgram'] =        { id:'overlordProgram',        unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'ultrite', count:4   }], notifs:['upgradesPane'], unlocks:['probe', 'terraformer'], }
            state.data['advUpgradeStorage1'] =     { id:'advUpgradeStorage1',     unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'ultrite', count:21  }], notifs:['upgradesPane'], }
            state.data['shipSpeedEnhancement'] =   { id:'shipSpeedEnhancement',   unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'ultrite', count:179 }], notifs:['upgradesPane'], }
            state.data['shipDefenceEnhancement'] = { id:'shipDefenceEnhancement', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'ultrite', count:199 }], notifs:['upgradesPane'], }
            state.data['shipPowerEnhancement'] =   { id:'shipPowerEnhancement',   unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'ultrite', count:206 }], notifs:['upgradesPane'], }
            state.data['techAutoStorageUpgrade'] = { id:'techAutoStorageUpgrade', unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'ultrite', count:220 }], notifs:['upgradesPane'], }
            state.data['techNanoswarm0'] =         { id:'techNanoswarm0',         unlocked:false, count:0, max:1, costType:'FIXED', baseCosts:[{ id:'ultrite', count:796 }], notifs:['upgradesPane'], unlocks:['techNanoswarm1'], }
            /*----------------------------------------------------------------*/
            
            // ACHIEVEMENT LIST
            /*----------------------------------------------------------------*/
            state.achievements = [
                /*------------------------------------------------------------*/
                state.data['achMeteorite'], state.data['achCarbon'], state.data['achOil'], state.data['achMetal'], state.data['achGem'], state.data['achWood'],
                state.data['achSilicon'], state.data['achUranium'], state.data['achLava'], state.data['achLunarite'], state.data['achMethane'], state.data['achTitanium'],
                state.data['achGold'], state.data['achSilver'], state.data['achHydrogen'], state.data['achHelium'], state.data['achIce'], state.data['achScience'],
                state.data['achFuel'],
                /*------------------------------------------------------------*/
                state.data['achEnergyT1'],    state.data['achEnergyT2'],    state.data['achEnergyT3'],    state.data['achEnergyT4'],    state.data['achEnergyT5'],   state.data['achEnergyT6'],
                state.data['achPlasmaT1'],    state.data['achPlasmaT2'],    state.data['achPlasmaT3'],    state.data['achPlasmaT4'],
                state.data['achMeteoriteT1'], state.data['achMeteoriteT2'], state.data['achMeteoriteT3'], state.data['achMeteoriteT4'],
                state.data['achCarbonT1'],    state.data['achCarbonT2'],    state.data['achCarbonT3'],    state.data['achCarbonT4'],    state.data['achCarbonT5'],
                state.data['achOilT1'],       state.data['achOilT2'],       state.data['achOilT3'],       state.data['achOilT4'],       state.data['achOilT5'],
                state.data['achMetalT1'],     state.data['achMetalT2'],     state.data['achMetalT3'],     state.data['achMetalT4'],     state.data['achMetalT5'],
                state.data['achGemT1'],       state.data['achGemT2'],       state.data['achGemT3'],       state.data['achGemT4'],       state.data['achGemT5'],
                state.data['achWoodT1'],      state.data['achWoodT2'],      state.data['achWoodT3'],      state.data['achWoodT4'],      state.data['achWoodT5'],
                state.data['achSiliconT1'],   state.data['achSiliconT2'],   state.data['achSiliconT3'],   state.data['achSiliconT4'],   state.data['achSiliconT5'],
                state.data['achUraniumT1'],   state.data['achUraniumT2'],   state.data['achUraniumT3'],   state.data['achUraniumT4'],   state.data['achUraniumT5'],
                state.data['achLavaT1'],      state.data['achLavaT2'],      state.data['achLavaT3'],      state.data['achLavaT4'],      state.data['achLavaT5'],
                state.data['achLunariteT1'],  state.data['achLunariteT2'],  state.data['achLunariteT3'],  state.data['achLunariteT4'],  state.data['achLunariteT5'],
                state.data['achMethaneT1'],   state.data['achMethaneT2'],   state.data['achMethaneT3'],   state.data['achMethaneT4'],   state.data['achMethaneT5'],
                state.data['achTitaniumT1'],  state.data['achTitaniumT2'],  state.data['achTitaniumT3'],  state.data['achTitaniumT4'],  state.data['achTitaniumT5'],
                state.data['achGoldT1'],      state.data['achGoldT2'],      state.data['achGoldT3'],      state.data['achGoldT4'],      state.data['achGoldT5'],
                state.data['achSilverT1'],    state.data['achSilverT2'],    state.data['achSilverT3'],    state.data['achSilverT4'],    state.data['achSilverT5'],
                state.data['achHydrogenT1'],  state.data['achHydrogenT2'],  state.data['achHydrogenT3'],  state.data['achHydrogenT4'],  state.data['achHydrogenT5'],
                state.data['achHeliumT1'],    state.data['achHeliumT2'],    state.data['achHeliumT3'],    state.data['achHeliumT4'],    state.data['achHeliumT5'],
                state.data['achIceT1'],       state.data['achIceT2'],       state.data['achIceT3'],       state.data['achIceT4'],       state.data['achIceT5'],
                state.data['achScienceT1'],   state.data['achScienceT2'],   state.data['achScienceT3'],   state.data['achScienceT4'],   state.data['achScienceT5'],
                state.data['achFuelT1'],      state.data['achFuelT2'],      state.data['achFuelT3'],
                state.data['achDysonT1'],     state.data['achDysonT2'],     state.data['achDysonT3'],
                /*------------------------------------------------------------*/
            ]
            state.resAchievements = [
                /*------------------------------------------------------------*/
                state.data['achMeteorite'], state.data['achCarbon'], state.data['achOil'], state.data['achMetal'], state.data['achGem'], state.data['achWood'],
                state.data['achSilicon'], state.data['achUranium'], state.data['achLava'], state.data['achLunarite'], state.data['achMethane'], state.data['achTitanium'],
                state.data['achGold'], state.data['achSilver'], state.data['achHydrogen'], state.data['achHelium'], state.data['achIce'], state.data['achScience'],
                state.data['achFuel'],
                /*------------------------------------------------------------*/
            ]
            state.prodAchievements = [
                /*------------------------------------------------------------*/
                state.data['achEnergyT1'],    state.data['achEnergyT2'],    state.data['achEnergyT3'],    state.data['achEnergyT4'],    state.data['achEnergyT5'],   state.data['achEnergyT6'],
                state.data['achPlasmaT1'],    state.data['achPlasmaT2'],    state.data['achPlasmaT3'],    state.data['achPlasmaT4'],
                state.data['achMeteoriteT1'], state.data['achMeteoriteT2'], state.data['achMeteoriteT3'], state.data['achMeteoriteT4'],
                state.data['achCarbonT1'],    state.data['achCarbonT2'],    state.data['achCarbonT3'],    state.data['achCarbonT4'],    state.data['achCarbonT5'],
                state.data['achOilT1'],       state.data['achOilT2'],       state.data['achOilT3'],       state.data['achOilT4'],       state.data['achOilT5'],
                state.data['achMetalT1'],     state.data['achMetalT2'],     state.data['achMetalT3'],     state.data['achMetalT4'],     state.data['achMetalT5'],
                state.data['achGemT1'],       state.data['achGemT2'],       state.data['achGemT3'],       state.data['achGemT4'],       state.data['achGemT5'],
                state.data['achWoodT1'],      state.data['achWoodT2'],      state.data['achWoodT3'],      state.data['achWoodT4'],      state.data['achWoodT5'],
                state.data['achSiliconT1'],   state.data['achSiliconT2'],   state.data['achSiliconT3'],   state.data['achSiliconT4'],   state.data['achSiliconT5'],
                state.data['achUraniumT1'],   state.data['achUraniumT2'],   state.data['achUraniumT3'],   state.data['achUraniumT4'],   state.data['achUraniumT5'],
                state.data['achLavaT1'],      state.data['achLavaT2'],      state.data['achLavaT3'],      state.data['achLavaT4'],      state.data['achLavaT5'],
                state.data['achLunariteT1'],  state.data['achLunariteT2'],  state.data['achLunariteT3'],  state.data['achLunariteT4'],  state.data['achLunariteT5'],
                state.data['achMethaneT1'],   state.data['achMethaneT2'],   state.data['achMethaneT3'],   state.data['achMethaneT4'],   state.data['achMethaneT5'],
                state.data['achTitaniumT1'],  state.data['achTitaniumT2'],  state.data['achTitaniumT3'],  state.data['achTitaniumT4'],  state.data['achTitaniumT5'],
                state.data['achGoldT1'],      state.data['achGoldT2'],      state.data['achGoldT3'],      state.data['achGoldT4'],      state.data['achGoldT5'],
                state.data['achSilverT1'],    state.data['achSilverT2'],    state.data['achSilverT3'],    state.data['achSilverT4'],    state.data['achSilverT5'],
                state.data['achHydrogenT1'],  state.data['achHydrogenT2'],  state.data['achHydrogenT3'],  state.data['achHydrogenT4'],  state.data['achHydrogenT5'],
                state.data['achHeliumT1'],    state.data['achHeliumT2'],    state.data['achHeliumT3'],    state.data['achHeliumT4'],    state.data['achHeliumT5'],
                state.data['achIceT1'],       state.data['achIceT2'],       state.data['achIceT3'],       state.data['achIceT4'],       state.data['achIceT5'],
                state.data['achScienceT1'],   state.data['achScienceT2'],   state.data['achScienceT3'],   state.data['achScienceT4'],   state.data['achScienceT5'],
                state.data['achFuelT1'],      state.data['achFuelT2'],      state.data['achFuelT3'],
                state.data['achDysonT1'],     state.data['achDysonT2'],     state.data['achDysonT3'],
                /*------------------------------------------------------------*/
            ]
            
            // RESOURCE LIST
            /*----------------------------------------------------------------*/
            state.resources = [
                /*------------------------------------------------------------*/
                state.data['energy'], state.data['plasma'],  state.data['meteorite'], state.data['carbon'], state.data['oil'], state.data['metal'],
                state.data['gem'], state.data['wood'], state.data['silicon'], state.data['uranium'], state.data['lava'], state.data['lunarite'],
                state.data['methane'], state.data['titanium'], state.data['gold'], state.data['silver'], state.data['hydrogen'], state.data['helium'],
                state.data['ice'], state.data['science'], state.data['fuel'], state.data['antimatter'],
                /*------------------------------------------------------------*/
            ]
            
            // PRODUCER LIST
            /*----------------------------------------------------------------*/
            state.producers = [
                /*------------------------------------------------------------*/
                state.data['energyT1'],     state.data['energyT2'],    state.data['energyT3'],    state.data['energyT4'],    state.data['energyT5'],   state.data['energyT6'],
                state.data['plasmaT1'],     state.data['plasmaT2'],    state.data['plasmaT3'],    state.data['plasmaT4'],
                state.data['meteoriteT1'],  state.data['meteoriteT2'], state.data['meteoriteT3'], state.data['meteoriteT4'],
                state.data['carbonT1'],     state.data['carbonT2'],    state.data['carbonT3'],    state.data['carbonT4'],    state.data['carbonT5'],
                state.data['oilT1'],        state.data['oilT2'],       state.data['oilT3'],       state.data['oilT4'],       state.data['oilT5'],
                state.data['metalT1'],      state.data['metalT2'],     state.data['metalT3'],     state.data['metalT4'],     state.data['metalT5'],
                state.data['gemT1'],        state.data['gemT2'],       state.data['gemT3'],       state.data['gemT4'],       state.data['gemT5'],
                state.data['woodT1'],       state.data['woodT2'],      state.data['woodT3'],      state.data['woodT4'],      state.data['woodT5'],
                state.data['siliconT1'],    state.data['siliconT2'],   state.data['siliconT3'],   state.data['siliconT4'],   state.data['siliconT5'],
                state.data['uraniumT1'],    state.data['uraniumT2'],   state.data['uraniumT3'],   state.data['uraniumT4'],   state.data['uraniumT5'],
                state.data['lavaT1'],       state.data['lavaT2'],      state.data['lavaT3'],      state.data['lavaT4'],      state.data['lavaT5'],
                state.data['lunariteT1'],   state.data['lunariteT2'],  state.data['lunariteT3'],  state.data['lunariteT4'],  state.data['lunariteT5'],
                state.data['methaneT1'],    state.data['methaneT2'],   state.data['methaneT3'],   state.data['methaneT4'],   state.data['methaneT5'],
                state.data['titaniumT1'],   state.data['titaniumT2'],  state.data['titaniumT3'],  state.data['titaniumT4'],  state.data['titaniumT5'],
                state.data['goldT1'],       state.data['goldT2'],      state.data['goldT3'],      state.data['goldT4'],      state.data['goldT5'],
                state.data['silverT1'],     state.data['silverT2'],    state.data['silverT3'],    state.data['silverT4'],    state.data['silverT5'],
                state.data['hydrogenT1'],   state.data['hydrogenT2'],  state.data['hydrogenT3'],  state.data['hydrogenT4'],  state.data['hydrogenT5'],
                state.data['heliumT1'],     state.data['heliumT2'],    state.data['heliumT3'],    state.data['heliumT4'],    state.data['heliumT5'],
                state.data['iceT1'],        state.data['iceT2'],       state.data['iceT3'],       state.data['iceT4'],       state.data['iceT5'],
                state.data['scienceT1'],    state.data['scienceT2'],   state.data['scienceT3'],   state.data['scienceT4'],   state.data['scienceT5'],
                state.data['fuelT1'],       state.data['fuelT2'],      state.data['fuelT3'],
                state.data['dysonT1'],      state.data['dysonT2'],     state.data['dysonT3'],
                state.data['antimatterT1'], 
                /*------------------------------------------------------------*/
            ]
            
            // STAR LIST
            /*----------------------------------------------------------------*/
            state.stars = [
                /*------------------------------------------------------------*/
                state.data['star301'],    state.data['star163901'], state.data['star181901'], state.data['star151801'], state.data['star25401'],  state.data['star146301'],
                state.data['star122601'], state.data['star79501'],  state.data['star1501'],   state.data['star79901'],  state.data['star37601'],  state.data['star123401'],
                state.data['star164301'], state.data['star219102'], state.data['star204702'], state.data['star116901'], state.data['star74001'],  state.data['star205102'],
                state.data['star144001'], state.data['star222301'], state.data['star3901'],   state.data['star168301'], state.data['star120901'], state.data['star125301'],
                state.data['star113101'], state.data['star89101'],  state.data['star93901'],  state.data['star79201'],  state.data['star80501'],  state.data['star77301'],
                state.data['star191701'], state.data['star199702'], state.data['star21001'],  state.data['star178302'], state.data['star32201'],  state.data['star74801'],
                /*------------------------------------------------------------*/
                state.data['star401'],    state.data['star25101'],  state.data['star207601'], state.data['star223901'], state.data['star121101'], state.data['star136701'],
                state.data['star166402'], state.data['star95001'],  state.data['star175902'], state.data['star56501'],  state.data['star167801'], state.data['star103201'],
                state.data['star113301'], state.data['star199602'], state.data['star157201'], state.data['star222201'], state.data['star6301'],   state.data['star214301'],
                state.data['star40801'],  state.data['star207301'], state.data['star169601'], state.data['star157101'], state.data['star178501'], state.data['star208601'],
                state.data['star78101'],  state.data['star123501'], state.data['star85901'],  state.data['star18501'],  state.data['star199801'], state.data['star141901'],
                state.data['star5201'],   state.data['star223701'], state.data['star166903'], state.data['star32101'],  state.data['star77801'],  state.data['star205201'],
                /*------------------------------------------------------------*/
                state.data['star201'],    state.data['star217101'], state.data['star166701'], state.data['star179501'], state.data['star6501'],   state.data['star222401'],
                state.data['star200001'], state.data['star24201'],  state.data['star224202'], state.data['star92801'],  state.data['star172701'], state.data['star86401'],
                state.data['star202902'], state.data['star177001'], state.data['star68301'],  state.data['star205001'], state.data['star13401'],  state.data['star34201'],
                state.data['star182101'], state.data['star178401'], state.data['star107601'], state.data['star192101'], state.data['star24001'],  state.data['star16601'],
                state.data['star27501'],  state.data['star121601'], state.data['star212102'], state.data['star117501'],
                /*------------------------------------------------------------*/
                state.data['star501'],    state.data['star130601'], state.data['star158101'], state.data['star224601'], state.data['star58601'],  state.data['star10101'],
                state.data['star194201'], state.data['star1101'],   state.data['star72501'],  state.data['star210501'], state.data['star189701'], state.data['star175601'],
                state.data['star206902'], state.data['star133601'], state.data['star135801'], state.data['star39101'],  state.data['star107001'], state.data['star105801'],
                state.data['star224201'], state.data['star205101'], state.data['star162501'], state.data['star4001'],   state.data['star141101'], state.data['star180502'],
                state.data['star208702'], state.data['star85501'],  state.data['star217202'], state.data['star180101'], state.data['star13801'],  state.data['star37101'],
                state.data['star42501'],  state.data['star80901'],  state.data['star215902'], state.data['star190502'], state.data['star99701'],  state.data['star176802'],
                /*------------------------------------------------------------*/
                state.data['star701'],    state.data['star601'],    state.data['star80101'],  state.data['star213301'], state.data['star13601'],  state.data['star51801'],
                state.data['star35801'],  state.data['star216801'], state.data['star224101'], state.data['star114001'], state.data['star15301'],  state.data['star69601'],
                state.data['star148501'], state.data['star155801'], state.data['star185101'], state.data['star175901'], state.data['star203902'], state.data['star204801'],
                state.data['star211202'], state.data['star100801'], state.data['star124101'], state.data['star139701'], state.data['star50401'],  state.data['star159101'],
                state.data['star148101'], state.data['star157301'], state.data['star72601'],  state.data['star224801'], state.data['star71001'],  state.data['star207501'],
                state.data['star168302'], state.data['star128901'], state.data['star68401'],  state.data['star30701'],  state.data['star193402'], state.data['star84201'],
                state.data['star76401'],  state.data['star32301'],  state.data['star191401'], state.data['star118301'], state.data['star166901'], state.data['star62901'],
                state.data['star21601'],  state.data['star63801'],  state.data['star187202'],
                /*------------------------------------------------------------*/
            ]
            
            // SHIP LIST
            /*----------------------------------------------------------------*/
            state.ships = [
                /*------------------------------------------------------------*/
                state.data['shipT1'], state.data['shipT2'], state.data['shipT3'], state.data['shipT4'], state.data['shipT5'],
                /*------------------------------------------------------------*/
            ]
            
            // MACHINE LIST
            /*----------------------------------------------------------------*/            
            state.machineT1 = ['energyT1', 'plasmaT1', 'meteoriteT1', 'carbonT1', 'oilT1', 'metalT1', 'gemT1', 'woodT1', 'siliconT1', 'uraniumT1', 'lavaT1', 'lunariteT1', 'methaneT1', 'titaniumT1', 'goldT1', 'silverT1', 'hydrogenT1', 'heliumT1', 'iceT1', 'scienceT1', 'fuelT1']
            state.machineT2 = ['energyT2', 'plasmaT2', 'meteoriteT2', 'carbonT2', 'oilT2', 'metalT2', 'gemT2', 'woodT2', 'siliconT2', 'uraniumT2', 'lavaT2', 'lunariteT2', 'methaneT2', 'titaniumT2', 'goldT2', 'silverT2', 'hydrogenT2', 'heliumT2', 'iceT2', 'scienceT2', 'fuelT2']
            state.machineT3 = ['energyT3', 'plasmaT3', 'meteoriteT3', 'carbonT3', 'oilT3', 'metalT3', 'gemT3', 'woodT3', 'siliconT3', 'uraniumT3', 'lavaT3', 'lunariteT3', 'methaneT3', 'titaniumT3', 'goldT3', 'silverT3', 'hydrogenT3', 'heliumT3', 'iceT3', 'scienceT3', 'fuelT3']
            state.machineT4 = ['energyT4', 'plasmaT4', 'meteoriteT4', 'carbonT4', 'oilT4', 'metalT4', 'gemT4', 'woodT4', 'siliconT4', 'uraniumT4', 'lavaT4', 'lunariteT4', 'methaneT4', 'titaniumT4', 'goldT4', 'silverT4', 'hydrogenT4', 'heliumT4', 'iceT4', 'scienceT4']
            state.machineT5 = ['energyT5', 'carbonT5', 'oilT5', 'metalT5', 'gemT5', 'woodT5', 'siliconT5', 'uraniumT5', 'lavaT5', 'lunariteT5', 'methaneT5', 'titaniumT5', 'goldT5', 'silverT5', 'hydrogenT5', 'heliumT5', 'iceT5', 'scienceT5']
            state.machineT6 = ['energyT6']
            
            // STORAGE UPGRADE LIST
            /*----------------------------------------------------------------*/            
            state.storageUpgrades = [
                /*------------------------------------------------------------*/
                state.data['meteoriteS1'], state.data['carbonS1'],
                state.data['oilS1'], state.data['metalS1'], state.data['gemS1'], state.data['woodS1'], state.data['siliconS1'], state.data['uraniumS1'], state.data['lavaS1'],
                state.data['lunariteS1'], state.data['methaneS1'], state.data['titaniumS1'], state.data['goldS1'], state.data['silverS1'],
                state.data['hydrogenS1'], state.data['heliumS1'], state.data['iceS1'],
                /*------------------------------------------------------------*/
            ]
            
            /*----------------------------------------------------------------*/            
            for (let i in state.data) {
                let item = state.data[i]
                if ('resource1' in item && 'resource2' in item) {
                    
                    if (item.resource1 == item.resource2) console.log(item)
                    
                    item.statueBaseCosts[0].id = item.resource1
                    item.statueBaseCosts[1].id = item.resource2
                }
            }
            /*----------------------------------------------------------------*/            
        },
        /*--------------------------------------------------------------------*/
        
        // LOADING / SAVING
        /*--------------------------------------------------------------------*/
        load({ state, commit, dispatch }) {
        
            var data = localStorage.getItem('ngsavecrypted')
            if (data && data !== null && data.length % 4 == 0) {
                
                let text = LZString.decompressFromBase64(data)
                if (!text) return console.warn('Load failed')
                
                data = JSON.parse(text)
                
                localStorage.removeItem('ngsave')
            }
            else data = JSON.parse(localStorage.getItem('ngsave'))
            
            if (data && data !== null && data.version && data.version == state.version) {
            
                state.locale = data.locale || 'en'
                state.activePane = data.activePane || 'metalPane'
                state.lastUpdateTime = data.lastUpdateTime || new Date().getTime()
                state.autoSaveInterval = data.autoSaveInterval || 30 * 1000
                state.companyName = data.companyName || 'NG Space'
                state.notifAutoSave = data.notifAutoSave
                state.notifAchievement = data.notifAchievement
                state.displayLockedItems = data.displayLockedItems || false
                state.displayPinnedItems = data.displayPinnedItems || false
                state.displayDoneTechs = data.displayDoneTechs == false ? data.displayDoneTechs : true
                state.displayRoadmap = data.displayRoadmap == false ? data.displayRoadmap : true
                state.username = data.username || null
                state.token = data.token || null
                state.emcAmount = data.emcAmount || 'max'
                state.autoResource = data.autoResource
                state.autoEmcInterval = data.autoEmcInterval || 1 * 1000
                state.displayEmcShortcut = data.displayEmcShortcut || false,
                state.collapsed = data.collapsed || []
                state.pinned = data.pinned || []
                state.titanSwapingCount = data.titanSwapingCount || 0
                
                if (data.stats) {
                    state.stats = data.stats
                    if (!(state.stats.enlightenCount)) state.stats.enlightenCount = 0
                    if (!(state.stats.allTimeUltrite)) state.stats.allTimeUltrite = 0
                }
                
                for (let i in data.entries) {
                    let item = data.entries[i]
                    
                    if ('unlocked' in item) state.data[i].unlocked = item.unlocked
                    if ('count' in item) state.data[i].count = item.count
                    if ('active' in item) state.data[i].active = item.active
                    if ('toggle' in item) state.data[i].toggle = item.toggle
                    if ('resource' in item) state.data[i].resource = item.resource
                    if ('opinion' in item) state.data[i].opinion = item.opinion
                    if ('status' in item) state.data[i].status = item.status
                    if ('spy' in item) state.data[i].spy = item.spy
                    if ('titan' in item) state.data[i].titan = item.titan
                    if ('auto' in item) state.data[i].auto = item.auto
                    if ('subStatus' in item) state.data[i].subStatus = item.subStatus
                }
            }
            
            if (state.data['autoEmc'].unlocked == false) state.autoResource = null
            
            if (state.data['ultrite'].unlocked == false) {
                
                state.data['overlordProgram'].unlocked = false
                state.data['overlordProgram'].count = 0
                
                state.data['advUpgradeStorage1'].unlocked = false
                state.data['advUpgradeStorage1'].count = 0
                
                state.data['shipSpeedEnhancement'].unlocked = false
                state.data['shipSpeedEnhancement'].count = 0

                state.data['shipDefenceEnhancement'].unlocked = false
                state.data['shipDefenceEnhancement'].count = 0

                state.data['shipPowerEnhancement'].unlocked = false
                state.data['shipPowerEnhancement'].count = 0

                state.data['techNanoswarm0'].unlocked = false
                state.data['techNanoswarm0'].count = 0
                
                state.data['techAutoStorageUpgrade'].unlocked = false
                state.data['techAutoStorageUpgrade'].count = 0
                
                state.data['techNanoswarm1'].unlocked = false
                state.data['techNanoswarm1'].count = 0
                
                state.data['nanoswarm'].unlocked = false
                state.data['nanoswarm'].count = 0
                state.data['nanoswarm'].resource = null
            }
            else {
                
                dispatch('unlock', 'overlordProgram')
                dispatch('unlock', 'advUpgradeStorage1')
                dispatch('unlock', 'shipSpeedEnhancement')
                dispatch('unlock', 'shipDefenceEnhancement')
                dispatch('unlock', 'shipPowerEnhancement')
                dispatch('unlock', 'techNanoswarm0')
                dispatch('unlock', 'techAutoStorageUpgrade')
            }
            
            if (state.stats.enlightenCount < 1) {
            
                state.data['overlordProgram'].count = 0
                state.data['advUpgradeStorage1'].count = 0
                state.data['shipSpeedEnhancement'].count = 0
                state.data['shipDefenceEnhancement'].count = 0
                state.data['shipPowerEnhancement'].count = 0
                state.data['techNanoswarm0'].count = 0
                state.data['techAutoStorageUpgrade'].count = 0
                state.data['techNanoswarm1'].count = 0
                
                state.data['nanoswarm'].count = 0
                state.data['nanoswarm'].resource = null
            }
            
            if (state.stats.allTimeUltrite < 796) {
            
                state.data['techNanoswarm0'].count = 0
                
                state.data['nanoswarm'].unlocked = false
                state.data['nanoswarm'].count = 0
                state.data['nanoswarm'].resource = null
            }
            
            if (state.data['techNanoswarm0'].count < 1) {
            
                state.data['nanoswarm'].unlocked = false
                state.data['nanoswarm'].count = 0
                state.data['nanoswarm'].resource = null
            }
            
            let ownedStarCount = 0
            
            for (let i in state.data) {
                let item = state.data[i]
                if ('count' in item && item.count > 0) {
                
                    if ('unlocks' in item) item.unlocks.forEach(unlock => { dispatch('unlock', unlock) })
                    
                    dispatch('onBuild', i)
                }
                
                if ('baseCosts' in item) commit('computeCosts', i)
                if ('baseStorage' in item) commit('computeStorage', i)
                
                if ('status' in item && item.status == 'owned') ownedStarCount += 1
                
                if (data && !data.stats) {
                    
                    if (state.machineT1.includes(item.id)) state.stats.machineT1.current += item.count
                    if (state.machineT2.includes(item.id)) state.stats.machineT2.current += item.count
                    if (state.machineT3.includes(item.id)) state.stats.machineT3.current += item.count
                    if (state.machineT4.includes(item.id)) state.stats.machineT4.current += item.count
                    if (state.machineT5.includes(item.id)) state.stats.machineT5.current += item.count
                    if (state.machineT6.includes(item.id)) state.stats.machineT6.current += item.count
                    if (state.ships.includes(item.id)) state.stats.ships.current += item.count
                }
            }
            
            if (ownedStarCount > 0) {
            
                state.data['dysonT3'].max += ownedStarCount
                state.data['antimatter'].storage += ownedStarCount * 100000
                
                if (!data.stats) state.stats.starOwned.current = ownedStarCount
                
                if (ownedStarCount >= 10) {
                    dispatch('unlock', 'ultrite')
                    dispatch('unlock', 'overlordProgram')
                    dispatch('unlock', 'advUpgradeStorage1')
                    dispatch('unlock', 'shipSpeedEnhancement')
                    dispatch('unlock', 'shipDefenceEnhancement')
                    dispatch('unlock', 'shipPowerEnhancement')
                    dispatch('unlock', 'techNanoswarm0')
                    dispatch('unlock', 'techAutoStorageUpgrade')
                }
            }
            
            if (data && !data.stats) {
                
                state.stats.allTimeDarkmatter = state.data['darkmatter'].count
                state.stats.machineT1.allTime = state.stats.machineT1.current
                state.stats.machineT2.allTime = state.stats.machineT2.current
                state.stats.machineT3.allTime = state.stats.machineT3.current
                state.stats.machineT4.allTime = state.stats.machineT4.current
                state.stats.machineT5.allTime = state.stats.machineT5.current
                state.stats.machineT6.allTime = state.stats.machineT6.current
                state.stats.ships.allTime = state.stats.ships.current
                state.stats.starOwned.allTime = state.stats.starOwned.current
            }
            
            if (state.data['darkmatter'].unlocked == true) {
            
                let list = [
                    'carnelian', 'upgradeGain', 'upgradeStorage1', 'upgradeStorage2', 'techEnergyStorage6', 'upgradeStorage3',
                    'prasnian', 'techPlasma3', 'upgradeWonder1', 'upgradeWonder2', 'upgradeWonder3', 'autoEmc', 'techPlasma4', 'techPlasmaStorage3',
                    'hyacinite', 'upgradeScience1', 'upgradeScience2', 'techScience5', 'upgradeEnergyBoost', 
                    'kitrinos', 'upgradeTier1', 'techEnergyStorage5', 'multiBuy', 'boostCapital', 'techTier5',
                    'moviton', 'upgradeFuel1', 'upgradeSpaceship', 'techPlasmaStorage4', 'techMeteorite3', 'techMeteorite4',
                    'overlord', 'boostDarkmatter', 'upgradeFaction',
                    'ultrite', 'overlordProgram', 'advUpgradeStorage1', 'shipSpeedEnhancement', 'shipDefenceEnhancement', 'shipPowerEnhancement', 'techNanoswarm0', 'techAutoStorageUpgrade',
                ]
                list.forEach(item => { dispatch('unlock', item) })
            }
        },
        /*--------------------------------------------------------------------*/
        save({ state }) {
        
            let saveddata = {
                
                version: state.version,
                locale: state.locale,
                activePane: state.activePane,
                lastUpdateTime: state.lastUpdateTime,
                autoSaveInterval: state.autoSaveInterval,
                companyName: state.companyName,
                notifAutoSave: state.notifAutoSave,
                notifAchievement: state.notifAchievement,
                displayLockedItems: state.displayLockedItems,
                displayPinnedItems: state.displayPinnedItems,
                displayDoneTechs: state.displayDoneTechs,
                displayRoadmap: state.displayRoadmap,
                username: state.username,
                token: state.token,
                emcAmount: state.emcAmount,
                autoResource: state.autoResource,
                autoEmcInterval: state.autoEmcInterval,
                displayEmcShortcut: state.displayEmcShortcut,
                stats: state.stats,
                collapsed: state.collapsed,
                pinned: state.pinned,
                titanSwapingCount: state.titanSwapingCount,
                
                entries: {},
            }
            
            for (let i in state.data) {
                let item = state.data[i]
                if (item.unlocked == true || ('titan' in item && item.titan == true) || ('auto' in item && item.auto == true)) {
                    saveddata.entries[i] = {}
                    
                    if ('unlocked' in item && item.unlocked != false) saveddata.entries[i].unlocked = item.unlocked
                    if ('count' in item && item.count != 0) saveddata.entries[i].count = item.count
                    if ('active' in item && item.active != 0) saveddata.entries[i].active = item.active
                    if ('toggle' in item && item.toggle != 'on') saveddata.entries[i].toggle = item.toggle
                    if ('resource' in item && item.resource != null) saveddata.entries[i].resource = item.resource
                    if ('opinion' in item && item.opinion != 0) saveddata.entries[i].opinion = item.opinion
                    if ('status' in item && item.status != 'new') saveddata.entries[i].status = item.status
                    if ('spy' in item && item.spy != 0) saveddata.entries[i].spy = item.spy
                    if ('titan' in item && item.titan == true) saveddata.entries[i].titan = item.titan
                    if ('auto' in item && item.auto == true) saveddata.entries[i].auto = item.auto
                    if ('subStatus' in item && item.subStatus != 'none') saveddata.entries[i].subStatus = item.subStatus
                }
            }
            
            let text = JSON.stringify(saveddata)
            let compressed = LZString.compressToBase64(text)
            localStorage.setItem('ngsavecrypted', compressed)
        },
        /*--------------------------------------------------------------------*/
        
        // GAME LOOP
        /*--------------------------------------------------------------------*/
        computeProdValues({ state, commit }) {
        
            let temp = {}
            state.resources.forEach(item => {
                item.problem = false
                temp[item.id] = { prod:0, boost:0, consumption:0, production:0 }
            })

            let prodBoost = 0
            item = state.data['boostProduction']
            if (item.unlocked && item.count > 0) { prodBoost += 0.01 * item.count }
            
            let dmBoost = 0
            item = state.data['boostDarkmatter']
            if (item.unlocked && item.count > 0) { dmBoost += 0.01 * state.data['darkmatter'].count }
            
            let capitalBoost = 0
            item = state.data['boostCapital']
            if (item.unlocked && item.count > 0) { state.resources.forEach(res => { if ('storage' in res && res.count >= res.storage) capitalBoost += 0.05 }) }
            
            let boost = 1
            boost *= 1 + prodBoost
            boost *= 1 + dmBoost
            boost *= 1 + capitalBoost
            boost -= 1
            
            state.stars.forEach(item => {
                if (item.status == 'owned') {
                    temp[item.resource1].boost += 0.25
                    temp[item.resource2].boost += 0.25
                    if (item.donor == true) {
                        temp[item.resource1].boost += 0.25
                        temp[item.resource2].boost += 0.25
                    }
                }
            })
            
            state.producers.forEach(item => {
                item.problem = null
                let canProduce = true
                let problem = false
                if (!item.unlocked) canProduce = false
                else {
                    if ('inputs' in item) {
                        item.inputs.forEach(input => {
                            if (state.data[input.id].count - (input.count * item.active) < 0) {
                                canProduce = false
                                problem = true
                                if ((input.count * item.active) > state.data[input.id].storage) item.problem = { type:'notEnoughInputStorage', id:input.id }
                                else item.problem = { type:'notEnoughInputCount', id:input.id }
                                return
                            }
                        })
                    }
                    if ('outputs' in item) {
                        item.outputs.forEach(output => { if (!state.data[output.id].unlocked || ('toggle' in state.data[output.id] && state.data[output.id].toggle != 'on')) {
                            canProduce = false
                            return
                        }})
                    }
                }
                if (canProduce) {
                    if ('inputs' in item) {
                        item.inputs.forEach(input => {
                            if (input.id == 'energy' && state.data['boostEnergy'].unlocked && state.data['boostEnergy'].count > 0) {
                                temp[input.id].consumption += (input.count * (1 - 0.01 * state.data['boostEnergy'].count)) * item.active
                            }
                            else {
                                temp[input.id].consumption += input.count * item.active
                            }
                        })
                    }
                    if ('outputs' in item) {
                        item.outputs.forEach(output => {
                            let tempBoost = boost
                            if (output.id == 'science' && state.data['boostScience'].unlocked && state.data['boostScience'].count > 0) tempBoost += 0.02 * state.data['boostScience'].count
                            temp[output.id].production += (output.count * item.active) * (1 + tempBoost) * (1 + temp[output.id].boost)
                        })
                    }
                }                
                if (problem) {
                    if ('outputs' in item) {
                        item.outputs.forEach(output => {
                            state.data[output.id].problem = true
                            if (!state.data[output.id].unlocked || ('toggle' in state.data[output.id] && state.data[output.id].toggle != 'on'))
                                state.data[output.id].problem = false
                        })
                    }
                }
            })

            let item = state.data['nanoswarm']
            if (item.unlocked && item.count > 0 && item.resource != null) {
                temp[item.resource].production *= Math.pow(1.0718, item.count)
            }

            state.resources.forEach(item => {
                let tempBoost = boost
                if (item.id == 'science' && state.data['boostScience'].unlocked && state.data['boostScience'].count > 0) tempBoost += 0.02 * state.data['boostScience'].count            
                temp[item.id].prod = temp[item.id].production - temp[item.id].consumption
                if (temp[item.id].prod > -0.001 && temp[item.id].prod < 0.001) temp[item.id].prod = 0
                commit('setDataProd', { id:item.id, prod:temp[item.id].prod })
                commit('setDataBoost', { id:item.id, boost:(1 + tempBoost) * (1 + temp[item.id].boost) })
                commit('setDataProduction', { id:item.id, production:temp[item.id].production })
                commit('setDataConsumption', { id:item.id, consumption:temp[item.id].consumption })
            })            
        },
        /*--------------------------------------------------------------------*/
        produceResources({ state, commit }, delta) {
        
            state.resources.forEach(item => {
                if (item.unlocked) {
                    let newValue = item.count + (item.prod * delta)
                    newValue = Math.max(0, newValue)
                    commit('setDataCount', { id:item.id, count:newValue })
                }
            })
        },
        /*--------------------------------------------------------------------*/
        updateTimers({ state }) {
        
            for (let i in state.data) {
                let item = state.data[i]
                if (item.unlocked) {
                    
                    let modStorage = 1
                    if (state.data['upgradeStorage3'].count > 0) modStorage = 10
                    
                    if ('costs' in item) {
                        item.costs.forEach(cost => {
                            if (cost.count <= state.data[cost.id].count) cost.timer = 0
                            else if ('storage' in state.data[cost.id] && cost.count > (state.data[cost.id].storage * modStorage)) cost.timer = -2
                            else if (state.data[cost.id].prod <= 0) cost.timer = -1
                            else cost.timer = (cost.count - state.data[cost.id].count) / state.data[cost.id].prod
                        })
                    }

                    if ('storage' in item) {
                        if (item.count >= (item.storage * modStorage)) item.storageTimer = 0
                        else if (item.prod == 0) item.storageTimer = -1
                        else if (item.prod < 0) item.storageTimer = -item.count / item.prod
                        else item.storageTimer = ((item.storage * modStorage) - item.count) / item.prod
                    }
                    
                    if ('status' in item && item.status == 'owned') {
                        if (item.subStatus == 'none') {
                            item.probeCosts.forEach(cost => {
                                if (cost.count <= state.data[cost.id].count) cost.timer = 0
                                else if ('storage' in state.data[cost.id] && cost.count > (state.data[cost.id].storage * modStorage)) cost.timer = -2
                                else if (state.data[cost.id].prod <= 0) cost.timer = -1
                                else cost.timer = (cost.count - state.data[cost.id].count) / state.data[cost.id].prod
                            })
                        }
                        else if (item.subStatus == 'probed' && item.atmosphere == true) {
                            item.terraformCosts.forEach(cost => {
                                if (cost.count <= state.data[cost.id].count) cost.timer = 0
                                else if ('storage' in state.data[cost.id] && cost.count > (state.data[cost.id].storage * modStorage)) cost.timer = -2
                                else if (state.data[cost.id].prod <= 0) cost.timer = -1
                                else cost.timer = (cost.count - state.data[cost.id].count) / state.data[cost.id].prod
                            })
                        }
                        else if (item.subStatus == 'terraformed' && item.atmosphere == true) {
                            item.statueCosts.forEach(cost => {
                                if (cost.count <= state.data[cost.id].count) cost.timer = 0
                                else if ('storage' in state.data[cost.id] && cost.count > (state.data[cost.id].storage * modStorage)) cost.timer = -2
                                else if (state.data[cost.id].prod <= 0) cost.timer = -1
                                else cost.timer = (cost.count - state.data[cost.id].count) / state.data[cost.id].prod
                            })
                        }
                    }
                }
            }
        },
        /*--------------------------------------------------------------------*/
        checkBoosts({ state, dispatch }) {
            
            let science = state.data['science']
            
            Array.from(['boostProduction', 'boostScience', 'boostEnergy', 'boostEnergyStorage']).forEach(id => {
            
                let item = state.data[id]
                if (item.unlocked == false && (item.count > 0 || science.count >= item.costs[0].count)) dispatch('unlock', id)
            })
        },
        /*--------------------------------------------------------------------*/
        updateAchievements({ state, commit }) {
            
            state.newAchievement = false
            
            let totalAchieved = 0
            state.achievements.forEach(item => {
                if (item.count < item.brackets.length) {
                
                    let limit = item.brackets[item.count]
                  if (item.count === 0) {
                    item.progress = (100 * state.data[item.data].count) / limit
                  } else {
                    const prev = item.brackets[item.count - 1]
                    item.progress =
                      (100 * (state.data[item.data].count - prev)) / (limit - prev)
                  }
                    if (item.progress >= 100) {
                        item.count += 1
                        commit('addNotif', 'achievementPane')
                        state.newAchievement = true                        
                    }
                }
                totalAchieved += pascal(item.count * 2 - 1)
            })
            
            state.rank.xpNeeded = fibonacci(state.rank.level + 7)
            state.rank.xpLeft = state.rank.xpNeeded - totalAchieved
            state.rank.percent = Math.floor(100 - (state.rank.xpLeft / state.rank.xpNeeded * 100))
            state.rank.current = state.rank.xpNeeded - state.rank.xpLeft
            
            if (state.rank.xpLeft <= 0) state.rank.level += 1
        },
        /*--------------------------------------------------------------------*/
        performAutoEmc({ state, dispatch }) {
        
            if (state.autoResource != null) {
                dispatch('convert', state.autoResource)
            }
        },
        /*--------------------------------------------------------------------*/
        performAutoStorageUpgrade({ state, dispatch, getters }) {
            
            if (state.data['techStorage'].count > 0 && state.data['techAutoStorageUpgrade'].count > 0) {
                state.storageUpgrades.forEach(building => {
                    if (building.auto == true && state.data[building.storage.id].count >= getters.getStorageCap(building.storage.id)) {
                        let previous = building.count - 1
                        while (previous != building.count) {
                            dispatch('build', { id:building.id, count:1 })
                            previous = building.count
                        }
                    }
                })
            }
        },
        /*--------------------------------------------------------------------*/
        refreshStorage({ state, commit }) {
            
            state.resources.forEach(item => {
                if (item.unlocked) {
                    let newValue = item.count
                    if ('storage' in item) newValue = Math.min(newValue, item.storage * state.storageExcess)
                    newValue = Math.max(0, newValue)
                    commit('setDataCount', { id:item.id, count:newValue })
                }
            })
        },
        /*--------------------------------------------------------------------*/
        refreshContext({ state }) {
            
            state.resources.forEach(item => { state.context.count[item.id] = item.count })
            
            state.context.count['ultrite'] = state.data['ultrite'].count
            state.context.count['darkmatter'] = state.data['darkmatter'].count
        },
        /*--------------------------------------------------------------------*/
        
        // INTERNAL
        /*--------------------------------------------------------------------*/
        unlock({ state, commit }, id) {
        
            let item = state.data[id]
            if ('unlocked' in item && item.unlocked != true) {
            
                item.unlocked = true
                
                if ('notifs' in item) item.notifs.forEach(notif => { commit('addNotif', notif) })
            }
        },
        /*--------------------------------------------------------------------*/
        onBuild({ state, commit, dispatch, getters }, id) {
            /*----------------------------------------------------------------*/
            if (id == 'upgradeTier2') {
                let list = ['oil', 'metal', 'gem', 'carbon', 'wood']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i] + 'T2']
                    item.outputs.forEach(output => { output.count *= 2 })
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeEnergy1') {
                state.data['energyT1'].outputs.forEach(output => { output.count *= 2 })
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeEnergy2') {
                state.data['energyT2'].outputs.forEach(output => { output.count *= 2 })
            }
            /*----------------------------------------------------------------*/
            else if (id == 'boostEnergyStorage') {
                commit('computeStorage', 'energy')
            }
            /*----------------------------------------------------------------*/
            else if (id == 'techTier5') {
                if (state.data['wonderMeteorite1'].count > 0) {
                    let list = ['carbonT5', 'achCarbonT5', 'oilT5', 'achOilT5', 'metalT5', 'achMetalT5', 'gemT5', 'achGemT5', 'woodT5', 'achWoodT5', 'siliconT5', 'achSiliconT5', 'uraniumT5', 'achUraniumT5', 'lavaT5', 'achLavaT5', 'lunariteT5', 'achLunariteT5', 'methaneT5', 'achMethaneT5', 'titaniumT5', 'achTitaniumT5', 'goldT5', 'achGoldT5', 'silverT5', 'achSilverT5', 'hydrogenT5', 'achHydrogenT5', 'heliumT5', 'achHeliumT5', 'iceT5', 'achIceT5']
                    list.forEach(unlock => { dispatch('unlock', unlock) })
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'wonderMeteorite1') {
                if (state.data['techTier5'].count > 0) {
                    let list = ['carbonT5', 'achCarbonT5', 'oilT5', 'achOilT5', 'metalT5', 'achMetalT5', 'gemT5', 'achGemT5', 'woodT5', 'achWoodT5', 'siliconT5', 'achSiliconT5', 'uraniumT5', 'achUraniumT5', 'lavaT5', 'achLavaT5', 'lunariteT5', 'achLunariteT5', 'methaneT5', 'achMethaneT5', 'titaniumT5', 'achTitaniumT5', 'goldT5', 'achGoldT5', 'silverT5', 'achSilverT5', 'hydrogenT5', 'achHydrogenT5', 'heliumT5', 'achHeliumT5', 'iceT5', 'achIceT5']
                    list.forEach(unlock => { dispatch('unlock', unlock) })
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeGain') {
                for (let i = 0; i < state.resources.length; i++) {
                    let item = state.resources[i]
                    if ('gain' in item) {
                        item.gain = 20
                    }
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeStorage1') {
                for (let i in state.data) {
                    let item = state.data[i]
                    if ('storage' in item && 'baseCosts' in item && item.costType == 'DOUBLE' && state.data[item.storage.id].baseStorage == 50 && item.count < 7) {
                        item.count = 7
                        commit('computeStorage', item.storage.id)
                        commit('computeCosts', item.id)
                    }
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeStorage2') {
                state.storagePrice -= 0.25
                for (let i in state.data) {
                    let item = state.data[i]
                    if ('storage' in item && 'baseCosts' in item && item.costType == 'DOUBLE') commit('computeCosts', item.id)
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeStorage3') {
                state.storageExcess = 10
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeWonder1') {
                let list = ['wonderPrecious1', 'wonderEnergetic1', 'wonderTechnological1', 'wonderMeteorite1']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i]]
                    item.baseCosts.forEach(cost => { cost.count *= 0.85 })
                    commit('computeCosts', item.id)
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeWonder2') {
                let list = ['wonderComm', 'wonderSpaceship', 'wonderAntimatter', 'wonderPortal', 'wonderStargate']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i]]
                    item.baseCosts.forEach(cost => { cost.count *= 0.8 })
                    commit('computeCosts', item.id)
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeWonder3') {
                let list = ['wonderPrecious0', 'wonderEnergetic0', 'wonderTechnological0', 'wonderMeteorite0']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i]]
                    if (item.count < 1) {
                        item.count = 1
                        if ('unlocks' in item) item.unlocks.forEach(unlock => { dispatch('unlock', unlock) })
                    }
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeScience1') {
                let item = state.data['scienceT1']
                if (item.count < 20) {
                    item.count = 20
                    item.active = 20
                    commit('computeCosts', item.id)
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeScience2') {
                let item = state.data['scienceT2']
                item.baseCosts.forEach(cost => { cost.count *= 0.8 })
                commit('computeCosts', item.id)
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeEnergyBoost') {
                let item = state.data['boostEnergy']
                item.max += 25
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeTier1') {
                let list = ['energyT1', 'plasmaT1', 'meteoriteT1', 'carbonT1', 'oilT1', 'metalT1', 'gemT1', 'woodT1', 'siliconT1', 'uraniumT1', 'lavaT1', 'lunariteT1', 'methaneT1', 'titaniumT1', 'goldT1', 'silverT1', 'hydrogenT1', 'heliumT1', 'iceT1']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i]]
                    item.baseCosts.forEach(cost => { cost.count *= 0.9 })
                    commit('computeCosts', item.id)
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeFuel1') {
                state.data['fuelT1'].outputs.forEach(output => { output.count *= 2 })
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeSpaceship') {
                let list = ['shield', 'engine', 'aero']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i]]
                    item.baseCosts.forEach(cost => { cost.count *= 0.65 })
                    commit('computeCosts', item.id)
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'upgradeFaction') {
                let upgrade = state.data[id]
                if (upgrade.count <= 1 || (upgrade.count == 2 && getters.getULStars <= 0)) {
                    upgrade.count = 3
                    let list = ['carnelian', 'prasnian', 'hyacinite', 'kitrinos', 'moviton']
                    for (let i = 0; i < list.length; i++) {
                        let item = state.data[list[i]]
                        item.opinion += 20
                    }
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'advUpgradeStorage1') {
                state.storagePrice -= 0.25
                for (let i in state.data) {
                    let item = state.data[i]
                    if ('storage' in item && 'baseCosts' in item && item.costType == 'DOUBLE') commit('computeCosts', item.id)
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'shipSpeedEnhancement') {
                let list = ['shipT1', 'shipT2', 'shipT3', 'shipT4', 'shipT5']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i]]
                    item.stats.speed *= 2
                    commit('computeFleetStats')
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'shipDefenceEnhancement') {
                let list = ['shipT1', 'shipT2', 'shipT3', 'shipT4', 'shipT5']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i]]
                    item.stats.defense *= 2
                    commit('computeFleetStats')
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'shipPowerEnhancement') {
                let list = ['shipT1', 'shipT2', 'shipT3', 'shipT4', 'shipT5']
                for (let i = 0; i < list.length; i++) {
                    let item = state.data[list[i]]
                    item.stats.power *= 2
                    commit('computeFleetStats')
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'radarT1' || id == 'radarT2') {
                let radius = state.data['radarT2'].count + (state.data['radarT1'].count * 5)
                for (let i in state.stars) {
                    let star = state.stars[i]
                    if (star.unlocked == false && star.distance <= radius) dispatch('unlock', star.id)
                }
            }
            /*----------------------------------------------------------------*/
            else if (id == 'shipT1' || id == 'shipT2' || id == 'shipT3' || id == 'shipT4' || id == 'shipT5') {
                commit('computeFleetStats')
            }
            /*----------------------------------------------------------------*/
            else if (id == 'dysonT1' || id == 'dysonT2' || id == 'dysonT3') {
                commit('computeCosts', 'segment')
            }
        },
        /*--------------------------------------------------------------------*/
        checkUltrite({ state, dispatch }) {
            
            let ownedStarCount = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.status == 'owned') ownedStarCount += 1
            }
            
            if (ownedStarCount >= 10) {
                dispatch('unlock', 'ultrite')
                dispatch('unlock', 'overlordProgram')
                dispatch('unlock', 'advUpgradeStorage1')
                dispatch('unlock', 'shipSpeedEnhancement')
                dispatch('unlock', 'shipDefenceEnhancement')
                dispatch('unlock', 'shipPowerEnhancement')
                dispatch('unlock', 'techNanoswarm0')
                dispatch('unlock', 'techAutoStorageUpgrade')
            }
        },
        /*--------------------------------------------------------------------*/
        
        // USER ACTIONS
        /*--------------------------------------------------------------------*/
        gain({ state }, id) {
            
            let item = state.data[id]
            if ('gain' in item) {
                for (let i = 0; i < item.gain; i++) {
                    let canGain = true
                    
                    if (item.count + 1 > item.storage * state.storageExcess) canGain = false
                    
                    if ('costs' in item) {
                        item['costs'].forEach(cost => {
                            if (state.data[cost.id].count - cost.count < 0) {
                                canGain = false
                                return
                            }
                        })
                    }
                                        
                    if (canGain) {
                    
                        if ('costs' in item) {
                            item['costs'].forEach(cost => {
                                state.data[cost.id].count -= cost.count
                            })
                        }
                        
                        if (item.count < (item.storage * state.storageExcess)) {
                            state.stats.manualGain.current += 1
                            state.stats.manualGain.allTime += 1
                        }
                        
                        item.count = Math.max(0, Math.min(item.count + 1, item.storage * state.storageExcess))                        
                    }
                }
            }
        },
        /*--------------------------------------------------------------------*/
        toggle({ state }, id) {
            
            let item = state.data[id]
            if ('toggle' in item) {
            
                if (item.toggle == 'on') item.toggle = 'off'
                else if (item.toggle == 'off') item.toggle = 'on'
            }
        },
        /*--------------------------------------------------------------------*/
        build({ state, dispatch, commit }, payload) {
            
            let id = payload.id
            let count = payload.count || 1
            
            let item = state.data[id]
            
            let upto = payload.upto            
            if (upto) count = upto - item.count
            
            for (let i = 0; i < count; i++) {
                let canBuild = true
                
                if ('max' in item && item.count >= item.max) canBuild = false

                if ('costs' in item) {
                    item['costs'].forEach(cost => {
                        if (state.data[cost.id].count - cost.count < 0) {
                            canBuild = false
                            return
                        }
                    })
                }
                
                if (canBuild) {
                
                    if ('costs' in item) {
                        item['costs'].forEach(cost => {
                            state.data[cost.id].count -= cost.count
                        })
                    }
                    
                    item.count += 1
                    if ('active' in item) item.active += 1

                    if ('notif' in item) commit('addNotif', item.notif)
                    if ('storage' in item) commit('computeStorage', item.storage.id)
                    if ('baseCosts' in item) commit('computeCosts', item.id)
                    
                    if ('unlocks' in item) item.unlocks.forEach(unlock => { dispatch('unlock', unlock) })
                    if ('faction' in item && 'opinion' in item) { state.data[item.faction].opinion += item.opinion }

                    dispatch('onBuild', item.id)
                    
                    if (state.machineT1.includes(item.id)) { state.stats.machineT1.current += 1; state.stats.machineT1.allTime += 1; }
                    if (state.machineT2.includes(item.id)) { state.stats.machineT2.current += 1; state.stats.machineT2.allTime += 1; }
                    if (state.machineT3.includes(item.id)) { state.stats.machineT3.current += 1; state.stats.machineT3.allTime += 1; }
                    if (state.machineT4.includes(item.id)) { state.stats.machineT4.current += 1; state.stats.machineT4.allTime += 1; }
                    if (state.machineT5.includes(item.id)) { state.stats.machineT5.current += 1; state.stats.machineT5.allTime += 1; }
                    if (state.machineT6.includes(item.id)) { state.stats.machineT6.current += 1; state.stats.machineT6.allTime += 1; }
                    if (state.ships.includes(item.id)) { state.stats.ships.current += 1; state.stats.ships.allTime += 1; }
                }
                else break
            }
        },
        /*--------------------------------------------------------------------*/
        destroy({ state, commit }, payload) {
            
            let id = payload.id
            let count = payload.count || 1
            
            let item = state.data[id]
            for (let i = 0; i < (count || 1); i++) {
                let canDestroy = true
                
                if (!('destroyable' in item) || item.destroyable != true || item.count <= 0) canDestroy = false

                if (canDestroy) {
                
                    item.count -= 1
                    if ('active' in item) item.active -= 1
                    
                    if ('storage' in item) commit('computeStorageValue', item.storage.id)
                    if ('baseCosts' in item) commit('computeCosts', item.id)
                }
                else break
            }
        },
        /*--------------------------------------------------------------------*/
        convert({ state, getters }, id) {
        
            let item = state.data[id]
            
            let amount
            if (state.emcAmount == 'max') amount = Math.min(Math.floor((state.data[item.source].count - state.data[item.source].consumption) / item.rate), getters.getStorageCap(item.resource) - state.data[item.resource].count)
            else amount = Math.min(state.emcAmount, getters.getStorageCap(item.resource) - state.data[item.resource].count)
            
            let required = (amount * item.rate)
            
            if (amount > 0 && state.data[item.source].count >= required) {
                state.data[item.source].count -= required
                state.data[item.resource].count += amount
            }
        },
        /*--------------------------------------------------------------------*/
        switchNano({ state }, id) {
            
            state.data['nanoswarm'].resource = id
        },
        /*--------------------------------------------------------------------*/
        setActiveShip({ state, commit }, payload) {
            
            let id = payload.id
            let count = payload.count
            
            let item = state.data[id]
            
            if (count == 'max') item.active = item.count
            else if (count == 'none') item.active = 0
            else if (item.active + count <= item.count && item.active + count >= 0) item.active += count
            
            commit('computeFleetStats')
        },
        /*--------------------------------------------------------------------*/
        spy({ state, commit, getters }, id) {
            
            let result = false
            let star = state.data[id]

            let chance = getters.getSpyChance(id) / 100
            let roll = Math.random()
            if (chance >= roll) {
                star.spy += 1
                result = true
            }
            else {
                let scout = state.data['shipT1']
                scout.count -= scout.active
                scout.active = 0
                
                commit('computeCosts', 'shipT1')
            }
            
            commit('computeFleetStats')
            
            return result
        },
        /*--------------------------------------------------------------------*/
        invade({ state, getters, dispatch, commit }, id) {
            
            let activeFleet = state.activeFleet
            if (activeFleet.power != 0) {
                let star = state.data[id]
                let result = false            
                
                let chance = getters.getInvadeChance(id)
                if (chance == 'peace') {
                    dispatch('absorbStar', id).then(res => { return res })
                    return
                }
                
                let roll = Math.random()
                if (chance >= roll) {
                
                    result = true
                    star.status = 'owned'
                    state.data['dysonT3'].max += 1
                    state.data['antimatter'].storage += 100000
                    
                    state.stats.starOwned.current += 1
                    state.stats.starOwned.allTime += 1
                    
                    let random = Math.random() * chance
                    if (random < 1) {
                        for (let i in state.ships) {
                        
                            let item = state.ships[i]
                            for (let j = 0; j < item.active; j++) {
                            
                                let destroyChance = Math.random()
                                if (destroyChance > chance) {
                                    item.count -= 1
                                    item.active -= 1
                                }
                            }
                            
                            commit('computeCosts', item.id)
                        }
                    }
                    
                    var faction = state.data[star.faction]
                    faction.opinion -= 10
                    
                    dispatch('checkUltrite')
                }
                else {
                
                    for (let i in state.ships) {
                        let item = state.ships[i]
                        item.count -= item.active
                        item.active = 0
                        
                        commit('computeCosts', item.id)
                    }
                }
                
                commit('computeFleetStats')
            
                return result
            }
        },
        /*--------------------------------------------------------------------*/
        absorb({ state, dispatch }, id) {
        
            let star = state.data[id]
            let faction = state.data[star.faction]
            if (faction.opinion >= 60) {
            
                faction.opinion -= 5
                star.status = 'owned'
                state.data['dysonT3'].max += 1
                state.data['antimatter'].storage += 100000
                
                state.stats.starOwned.current += 1
                state.stats.starOwned.allTime += 1
                
                dispatch('checkUltrite')
                
                return true
            }
            
            return false
        },
        /*--------------------------------------------------------------------*/
        rebirth({ state, getters, dispatch }) {
        
            if (state.data['dysonT3'].count < 1) return false
            
            state.data['darkmatter'].count += getters.getPotentialDM
            state.stats.allTimeDarkmatter += getters.getPotentialDM
            
            state.collapsed = []
            state.pinned = []

            state.emcAmount = 'max'
            state.autoResource = null
            state.autoEmcInterval = 1 * 1000
            state.displayEmcShortcut = false
            
            let exludedList = [
                'darkmatter',
                'carnelian', 'upgradeGain', 'upgradeStorage1', 'upgradeStorage2', 'techEnergyStorage6', 'upgradeStorage3',
                'prasnian', 'techPlasma3', 'upgradeWonder1', 'upgradeWonder2', 'upgradeWonder3', 'autoEmc', 'techPlasma4', 'techPlasmaStorage3',
                'hyacinite', 'upgradeScience1', 'upgradeScience2', 'techScience5', 'upgradeEnergyBoost', 
                'kitrinos', 'upgradeTier1', 'techEnergyStorage5', 'multiBuy', 'boostCapital', 'techTier5',
                'moviton', 'upgradeFuel1', 'upgradeSpaceship', 'techPlasmaStorage4', 'techMeteorite3', 'techMeteorite4',
                'overlord', 'boostDarkmatter', 'upgradeFaction',
                'ultrite', 'overlordProgram', 'advUpgradeStorage1', 'shipSpeedEnhancement', 'shipDefenceEnhancement', 'shipPowerEnhancement', 'techNanoswarm0', 'techAutoStorageUpgrade',
            ]
            
            for (let i in state.data) {
                let item = state.data[i]
                if (!(exludedList.includes(i))) {
                    
                    if ('unlocked' in item) item.unlocked = false
                    if ('count' in item) item.count = 0
                    if ('active' in item) item.active = 0
                    if ('toggle' in item) item.toggleState = 'on'
                    if ('resource' in item) item.resource = null
                    if ('status' in item) item.status = 'new'
                    if ('spy' in item) item.spy = 0
                }
            }
            
            state.stats.lastRebirthDate = new Date().getTime()
            state.stats.rebirthCount += 1
            state.stats.manualGain.current = 0
            state.stats.machineT1.current = 0
            state.stats.machineT2.current = 0
            state.stats.machineT3.current = 0
            state.stats.machineT4.current = 0
            state.stats.machineT5.current = 0
            state.stats.machineT6.current = 0
            state.stats.ships.current = 0
            state.stats.starOwned.current = 0
            
            dispatch('rebirthFaction', { id:'carnelian', items:['upgradeGain', 'upgradeStorage1', 'upgradeStorage2', 'techEnergyStorage6', 'upgradeStorage3'] })
            dispatch('rebirthFaction', { id:'prasnian', items:['techPlasma3', 'upgradeWonder1', 'upgradeWonder2', 'upgradeWonder3', 'autoEmc', 'techPlasma4', 'techPlasmaStorage3'] })
            dispatch('rebirthFaction', { id:'hyacinite', items:['upgradeScience1', 'upgradeScience2', 'techScience5', 'upgradeEnergyBoost'] })
            dispatch('rebirthFaction', { id:'kitrinos', items:['upgradeTier1', 'techEnergyStorage5', 'multiBuy', 'boostCapital', 'techTier5'] })
            dispatch('rebirthFaction', { id:'moviton', items:['upgradeFuel1', 'upgradeSpaceship', 'techPlasmaStorage4', 'techMeteorite3', 'techMeteorite4'] })
            dispatch('rebirthFaction', { id:'overlord', items:['boostDarkmatter', 'upgradeFaction'] })
            
            if (state.data['upgradeFaction'].count > 0) {
                state.data['upgradeFaction'].count = 1
                dispatch('onBuild', 'upgradeFaction')
            }
            
            dispatch('save')
            
            return true
        },
        /*--------------------------------------------------------------------*/
        rebirthFaction({ state }, payload) {
        
            let faction = state.data[payload.id]
            faction.opinion = 0
            
            payload.items.forEach(id => {
                if (state.data[id].count > 0) faction.opinion += state.data[id].opinion
            })
        },
        /*--------------------------------------------------------------------*/
        enlighten({ state, getters, dispatch }, payload) {
        
            let ownedStarCount = 0
            for (let i in state.stars) {
                let star = state.stars[i]
                if (star.status == 'owned') ownedStarCount += 1
            }
            if (ownedStarCount < 10) return false
            
            if (!payload) return false
            state.data[payload].titan = true

            state.data['ultrite'].count += getters.getPotentialUL
            state.stats.allTimeUltrite += getters.getPotentialUL
            
            state.collapsed = []
            state.pinned = []

            state.emcAmount = 'max'
            state.autoResource = null
            state.autoEmcInterval = 1 * 1000
            state.displayEmcShortcut = false
            
            let exludedList = [
                'darkmatter',
                'carnelian', 'upgradeGain', 'upgradeStorage1', 'upgradeStorage2', 'upgradeStorage3',
                'prasnian', 'upgradeWonder1', 'upgradeWonder2', 'upgradeWonder3', 'autoEmc',
                'hyacinite', 'upgradeScience1', 'upgradeScience2', 'upgradeEnergyBoost', 
                'kitrinos', 'upgradeTier1', 'multiBuy', 'boostCapital',
                'moviton', 'upgradeFuel1', 'upgradeSpaceship',
                'overlord', 'boostDarkmatter', 'upgradeFaction',
                'ultrite', 'overlordProgram', 'advUpgradeStorage1', 'shipSpeedEnhancement', 'shipDefenceEnhancement', 'shipPowerEnhancement', 'techNanoswarm0', 'techAutoStorageUpgrade',
            ]
            
            state.data['darkmatter'].count = 0
            
            for (let i in state.data) {
                let item = state.data[i]
                if (!(exludedList.includes(i))) {
                    
                    if ('unlocked' in item) item.unlocked = false
                    if ('count' in item) item.count = 0
                    if ('active' in item) item.active = 0
                    if ('toggle' in item) item.toggleState = 'on'
                    if ('resource' in item) item.resource = null
                    if ('status' in item) item.status = 'new'
                    if ('spy' in item) item.spy = 0
                }
            }
            
            state.stats.lastEnlightenDate = new Date().getTime()
            state.stats.enlightenCount += 1
            state.stats.manualGain.current = 0
            state.stats.machineT1.current = 0
            state.stats.machineT2.current = 0
            state.stats.machineT3.current = 0
            state.stats.machineT4.current = 0
            state.stats.machineT5.current = 0
            state.stats.machineT6.current = 0
            state.stats.ships.current = 0
            state.stats.starOwned.current = 0
            
            dispatch('rebirthFaction', { id:'carnelian', items:['upgradeGain', 'upgradeStorage1', 'upgradeStorage2', 'techEnergyStorage6', 'upgradeStorage3'] })
            dispatch('rebirthFaction', { id:'prasnian', items:['techPlasma3', 'upgradeWonder1', 'upgradeWonder2', 'upgradeWonder3', 'autoEmc', 'techPlasma4', 'techPlasmaStorage3'] })
            dispatch('rebirthFaction', { id:'hyacinite', items:['upgradeScience1', 'upgradeScience2', 'techScience5', 'upgradeEnergyBoost'] })
            dispatch('rebirthFaction', { id:'kitrinos', items:['upgradeTier1', 'techEnergyStorage5', 'multiBuy', 'boostCapital', 'techTier5'] })
            dispatch('rebirthFaction', { id:'moviton', items:['upgradeFuel1', 'upgradeSpaceship', 'techPlasmaStorage4', 'techMeteorite3', 'techMeteorite4'] })
            dispatch('rebirthFaction', { id:'overlord', items:['boostDarkmatter', 'upgradeFaction'] })
            
            if (state.data['upgradeFaction'].count > 0) {
                state.data['upgradeFaction'].count = 1
                dispatch('onBuild', 'upgradeFaction')
            }
            
            dispatch('save')
            
            return true
        },
        /*--------------------------------------------------------------------*/
        check({ state, commit }, payload) {
        
            let item = state.data[payload]
            
            let canBuild = true
            
            if ('subStatus' in item && item.subStatus != 'none') canBuild = false

            if ('probeCosts' in item) {
                item['probeCosts'].forEach(cost => {
                    if (state.data[cost.id].count - cost.count < 0) {
                        canBuild = false
                        return
                    }
                })
            }
            
            if (canBuild) {
            
                if ('costs' in item) {
                    item['probeCosts'].forEach(cost => {
                        state.data[cost.id].count -= cost.count
                    })
                }
                
                item.subStatus = 'probed'
                
                commit('computeCosts', 'probe')
            }
        },
        /*--------------------------------------------------------------------*/
        terraform({ state, commit }, payload) {
        
            let item = state.data[payload]
            
            let canBuild = true
            
            if ('subStatus' in item && item.subStatus != 'probed') canBuild = false

            if ('terraformCosts' in item) {
                item['terraformCosts'].forEach(cost => {
                    if (state.data[cost.id].count - cost.count < 0) {
                        canBuild = false
                        return
                    }
                })
            }
            
            if (canBuild) {
            
                if ('costs' in item) {
                    item['terraformCosts'].forEach(cost => {
                        state.data[cost.id].count -= cost.count
                    })
                }
                
                item.subStatus = 'terraformed'
                
                commit('computeCosts', 'terraformer')
            }
        },
        /*--------------------------------------------------------------------*/
        buildStatue({ state }, payload) {
        
            let item = state.data[payload]
            
            let canBuild = true
            
            if ('subStatus' in item && item.subStatus != 'terraformed') canBuild = false

            if ('statueCosts' in item) {
                item['statueCosts'].forEach(cost => {
                    if (state.data[cost.id].count - cost.count < 0) {
                        canBuild = false
                        return
                    }
                })
            }
            
            if (canBuild) {
            
                if ('costs' in item) {
                    item['statueCosts'].forEach(cost => {
                        state.data[cost.id].count -= cost.count
                    })
                }
                
                item.subStatus = 'statued'
            }
        },
        /*--------------------------------------------------------------------*/
        swapTitan({ state, commit }, payload) {
            
            let titanSource = payload.source
            let titanDestination = payload.destination
                        
            if (state.titanSwapingCount > 0) return
            if (state.data[titanSource].titan == false) return
            if (state.data[titanDestination].titan == true) return
            
            state.data[titanSource].titan = false
            state.data[titanDestination].titan = true
            
            state.titanSwapingCount += 1
            
            for (let i in state.data) {
                let item = state.data[i]
                if ('baseCosts' in item) commit('computeCosts', i)
            }
        },
        /*--------------------------------------------------------------------*/
    },
})